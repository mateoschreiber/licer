import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function parseAllowedOrigins() {
  const configured = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
  const origins = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([
    ...origins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.54',
    'http://192.168.1.54:8088',
  ]);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const apiPrefix = process.env.API_PREFIX ?? '/api/v1';
  const allowedOrigins = parseAllowedOrigins();

  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));
  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin denied'), false);
    },
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
