# 배포 인프라 계획

> 단일 EC2 + Docker Compose로 운영한다.
> nginx가 TLS 종료 + 라우팅을 담당한다.

---

## 1. Docker Compose 구성

### 서비스 목록

| 서비스 | 이미지 | 포트 | 역할 |
|--------|--------|------|------|
| `nginx` | nginx:alpine | 80, 443 (외부) | TLS 종료, 리버스 프록시 |
| `api` | 자체 빌드 | 4000 (내부) | NestJS GraphQL + Graphile Worker |
| `web` | 자체 빌드 | 3000 (내부) | Next.js SSR |
| `postgres` | postgres:16 | 5432 (내부) | 데이터베이스 |

### docker-compose.yml 구조

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - api
      - web
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://playnote:${DB_PASSWORD}@postgres:5432/playnote
      - S3_BUCKET=${S3_BUCKET}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - PUBLIC_BASE_URL=${PUBLIC_BASE_URL}
      - API_PORT=4000
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: docker/web/Dockerfile
    environment:
      - NEXT_PUBLIC_GRAPHQL_URL=${PUBLIC_BASE_URL}/graphql
      - NEXT_PUBLIC_KAKAO_JS_KEY=${KAKAO_JS_KEY}
      - NODE_ENV=production
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=playnote
      - POSTGRES_USER=playnote
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U playnote"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 2. nginx 설정

### nginx.conf

```nginx
events {
  worker_connections 1024;
}

http {
  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

  upstream api {
    server api:4000;
  }

  upstream web {
    server web:3000;
  }

  server {
    listen 80;
    server_name playnote.app;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name playnote.app;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # GraphQL API
    location /graphql {
      limit_req zone=api burst=50 nodelay;
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js (나머지 전부)
    location / {
      proxy_pass http://web;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    # 클라이언트 업로드 크기 (S3 presigned이므로 큰 파일은 직접 S3로)
    client_max_body_size 1m;
  }
}
```

---

## 3. Dockerfile

### API (NestJS)

```dockerfile
# docker/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY apps/api/package.json apps/api/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY apps/api/ ./
RUN yarn build

FROM node:20-alpine AS runner

# Python for OCR CLI
RUN apk add --no-cache python3 py3-pip
COPY scripts/ocr/ /app/scripts/ocr/
RUN pip3 install -r /app/scripts/ocr/requirements.txt

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4000
CMD ["node", "dist/main.js"]
```

### Web (Next.js)

```dockerfile
# docker/web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY apps/web/package.json apps/web/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY apps/web/ ./
RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 4. 초기 데이터 (init.sql)

```sql
-- docker/postgres/init.sql
-- 초기 Friend 데이터 (단톡방 멤버)
-- UUID v7은 애플리케이션에서 생성하므로, 여기서는 gen_random_uuid() 사용

INSERT INTO friend (id, display_name, riot_game_name, riot_tag_line, is_archived, created_at, updated_at)
VALUES
  (gen_random_uuid(), '철수', 'chulsu', 'KR1', false, NOW(), NOW()),
  (gen_random_uuid(), '영희', 'younghee', 'KR1', false, NOW(), NOW()),
  -- ... 단톡방 멤버 추가
;
```

> init.sql은 PostgreSQL 컨테이너 최초 생성 시에만 실행된다.
> 실제 멤버 데이터는 운영 시 확정.

---

## 5. 환경 변수 관리

### .env (프로덕션)

```env
# Database
DB_PASSWORD=<strong-random-password>

# S3
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET=playnote-attachments

# Public URL
PUBLIC_BASE_URL=https://playnote.app

# Kakao
KAKAO_JS_KEY=<kakao-javascript-key>
```

### .env는 git에 포함하지 않음

```
# .gitignore
.env
.env.local
docker/nginx/certs/
```

---

## 6. SSL 인증서

### Let's Encrypt (권장)

```bash
# certbot으로 인증서 발급
sudo certbot certonly --standalone -d playnote.app

# 인증서 위치
# /etc/letsencrypt/live/playnote.app/fullchain.pem
# /etc/letsencrypt/live/playnote.app/privkey.pem

# docker/nginx/certs/에 복사 또는 volume 마운트
```

### 자동 갱신

```bash
# crontab
0 0 1 * * certbot renew --quiet && docker compose restart nginx
```

---

## 7. 배포 절차

### 최초 배포

```bash
# 1. EC2 인스턴스 준비 (Docker, Docker Compose 설치)
# 2. 코드 배포
git clone <repo> /opt/playnote
cd /opt/playnote

# 3. 환경 변수 설정
cp .env.example .env
# .env 편집

# 4. SSL 인증서 배치
mkdir -p docker/nginx/certs
# 인증서 파일 복사

# 5. 빌드 + 실행
docker compose build
docker compose up -d

# 6. DB 마이그레이션
docker compose exec api yarn migration:up

# 7. 확인
curl https://playnote.app/graphql  # GraphQL endpoint
curl https://playnote.app          # Next.js
```

### 업데이트 배포

```bash
cd /opt/playnote
git pull

# 빌드 + 재시작
docker compose build api web
docker compose up -d api web

# 마이그레이션 (필요 시)
docker compose exec api yarn migration:up
```

---

## 8. S3 버킷 설정

```
버킷명: playnote-attachments
리전: ap-northeast-2

CORS 설정:
- AllowedOrigins: ["https://playnote.app"]
- AllowedMethods: ["PUT", "GET"]
- AllowedHeaders: ["*"]
- MaxAgeSeconds: 3600

버킷 정책:
- 기본 비공개
- presigned URL로만 접근
- (향후 CloudFront 연동 시 OAI 설정)
```

---

## 9. 모니터링 (최소)

| 항목 | 방법 |
|------|------|
| 서비스 상태 | `docker compose ps` |
| API 로그 | `docker compose logs -f api` |
| Worker 로그 | API 로그에 포함 (같은 프로세스) |
| DB 상태 | `docker compose exec postgres pg_isready` |
| 디스크 사용량 | `df -h` |
| postgres 데이터 | `docker volume inspect playnote_postgres_data` |

### 헬스체크 엔드포인트 (선택)

```
GET /health → { status: 'ok', db: 'connected', worker: 'running' }
```

---

## 10. 롤백 전략

```bash
# 이전 이미지로 롤백
docker compose down api web
git checkout <previous-tag>
docker compose build api web
docker compose up -d api web

# DB 마이그레이션 롤백 (필요 시)
docker compose exec api yarn migration:down
```

---

## 11. 검증 체크리스트

- [ ] `docker compose up -d` — 전체 서비스 기동
- [ ] `https://playnote.app/graphql` — GraphQL Playground 접근
- [ ] `https://playnote.app` — Next.js 랜딩 페이지
- [ ] nginx rate limiting 동작 확인
- [ ] S3 presigned upload 동작 확인
- [ ] Graphile Worker 태스크 실행 확인
- [ ] SSL 인증서 유효성 확인
- [ ] 서비스 재시작 후 데이터 유지 (postgres volume)
