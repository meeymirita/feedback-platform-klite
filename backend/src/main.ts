import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { createClient } from 'redis';
import session from 'express-session';
import { ms, StringValue } from './libs/common/utils/ms.util';
import { parseBoolean } from './libs/common/utils/parse-boolean.util';
import { RedisStore } from 'connect-redis';
import { IS_DEV_ENV } from './libs/common/utils/is-dev-util';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  // За реверс-прокси (Caddy) в проде backend видит HTTP, а не HTTPS.
  // Без этого secure-куки не выставляются и req.protocol врёт.
  // В dev (прямой доступ на :3000) не нужно.
  if (!IS_DEV_ENV) {
    app.set('trust proxy', 1);
  }

  // Все роуты под /api/v1/*. Caddy проксирует /api/* на backend без среза
  // префикса (handle, не handle_path) — путь одинаков у браузера и бэка.
  app.setGlobalPrefix('api/v1');

  const redis = createClient({ url: config.getOrThrow('REDIS_URI') });
  await redis.connect();

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      // connect-redis умеет touch → нет смысла переписывать сессию на каждый запрос.
      resave: false,
      saveUninitialized: false,
      cookie: {
        // Пустой SESSION_DOMAIN → host-only кука (рекомендуется для localhost).
        // logout чистит куку тем же выражением, иначе браузер её не удалит.
        domain: config.get<string>('SESSION_DOMAIN') || undefined,
        path: '/',
        maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
        httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
        // Прод: SESSION_SECURE=true (только по HTTPS). Требует trust proxy выше.
        secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
        sameSite: 'lax',
      },
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow('SESSION_FOLDER'),
      }),
    }),
  );
  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
  });
  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}
bootstrap();
