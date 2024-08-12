import { IConfig } from './interfaces/config.interface';
import { parseRedisUrl } from 'parse-redis-url-simple';

export function config(): IConfig {
  const testing = process.env.NODE_ENV !== 'production';
  return {
    port: parseInt(process.env.PORT, 10) ?? 3000,
    domain: process.env.DOMAIN ?? 'example.com',
    jwt: {
      access: {
        secret: process.env.JWT_ACCESS_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_ACCESS_TIME, 10) ?? 600,
      },
      confirmation: {
        secret: process.env.JWT_CONFIRMATION_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_CONFIRMATION_TIME, 10) ?? 3600,
      },
      resetPassword: {
        secret: process.env.JWT_RESET_PASSWORD_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_RESET_PASSWORD_TIME, 10) ?? 1800,
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET ?? 'secret',
        time: parseInt(process.env.JWT_REFRESH_TIME, 10) ?? 604800,
      },
    },
    redis: parseRedisUrl(process.env.REDIS_URL)[0] ?? {
      host: 'localhost',
    },
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
