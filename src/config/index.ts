import { IConfig } from './interfaces/config.interface';
import { parseRedisUrl } from 'parse-redis-url-simple';

export function config(): IConfig {
  const testing = process.env.NODE_ENV !== 'production';
  return {
    port: parseInt(process.env.PORT ?? '300', 10),
    domain: process.env.DOMAIN ?? 'example.com',
    jwt: {
      access: {
        secret: process.env.JWT_ACCESS_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_ACCESS_TIME ?? '60', 10),
      },
      confirmation: {
        secret: process.env.JWT_CONFIRMATION_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_CONFIRMATION_TIME ?? '360', 10),
      },
      resetPassword: {
        secret: process.env.JWT_RESET_PASSWORD_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_RESET_PASSWORD_TIME ?? '180', 10),
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_REFRESH_TIME ?? '604800', 10),
      },
    },
    redis: parseRedisUrl(process.env.REDIS_URL)[0] ?? {
      host: 'localhost',
    },
    cookie_refresh: process.env.REFRESH_COOKIE ?? 'cookie_refresh',
    cookie_secret: process.env.COOKIE_SECRET ?? 'secret',
    emailService: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
    testing,
  };
}
