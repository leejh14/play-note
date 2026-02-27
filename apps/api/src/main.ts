import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
}

bootstrap();
