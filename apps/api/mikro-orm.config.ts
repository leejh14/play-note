import { Options } from '@mikro-orm/postgresql';

const config: Options = {
  entities: ['./dist/**/*.orm-entity.js'],
  entitiesTs: ['./src/**/*.orm-entity.ts'],
  dbName: process.env.DB_NAME ?? 'playnote',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'playnote',
  password: process.env.DB_PASSWORD ?? 'playnote',
  migrations: {
    path: './migrations',
    pathTs: './src/migrations',
  },
};

export default config;
