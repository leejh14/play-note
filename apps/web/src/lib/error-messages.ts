const DEFAULT_MESSAGE = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

const GRAPHQL_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "인증 정보가 없습니다. 공유 링크로 입장하거나 새 세션을 생성해주세요.",
  INVALID_TOKEN: "유효하지 않은 토큰입니다. 최신 공유 링크로 다시 입장해주세요.",
  SESSION_NOT_FOUND: "세션을 찾을 수 없습니다. 링크가 만료되었거나 삭제되었습니다.",
  FORBIDDEN: "이 기능은 관리자 토큰이 필요합니다.",
  NOT_FOUND: "요청한 데이터를 찾을 수 없습니다.",
  VALIDATION_ERROR: "입력값을 다시 확인해주세요.",
};

export function getGraphqlErrorMessage(code?: string | null): string {
  if (!code) return DEFAULT_MESSAGE;
  return GRAPHQL_ERROR_MESSAGES[code] ?? DEFAULT_MESSAGE;
}
