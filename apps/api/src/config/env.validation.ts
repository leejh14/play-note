import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  API_PORT: Joi.number().default(4000),
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
});
