import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  API_PORT: Joi.number().default(4000),
  API_BASE_URL: Joi.string().uri().optional(),
  PUBLIC_BASE_URL: Joi.string().default('http://localhost:3000'),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().default('playnote'),
  DB_USER: Joi.string().default('playnote'),
  DB_PASSWORD: Joi.string().default('playnote'),

  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  S3_BUCKET: Joi.string().default('playnote-attachments'),
  LOCAL_STORAGE_DIR: Joi.string().optional(),
  GRAPHILE_WORKER_CONCURRENCY: Joi.number().integer().min(1).default(1),
  OCR_TIMEOUT_MS: Joi.number().integer().min(1).default(60000),
  OCR_TOP_K: Joi.number().integer().min(1).default(3),
  OCR_MIN_SCORE_FULL: Joi.number().min(0).max(100).default(90),
  OCR_MIN_SCORE_NAME_ONLY: Joi.number().min(0).max(100).default(92),
});
