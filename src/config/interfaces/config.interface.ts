import { IJwt } from 'src/config/interfaces/jwt-config.interface';
import { RedisOptions } from 'ioredis';
import { IEmailConfig } from 'src/config/interfaces/email-config.interface';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { OAuthConfig } from 'src/config/interfaces/oauth-config.interface';

export interface IConfig {
  port: number;
  domain: string;
  testing: boolean;
  jwt: IJwt;
  redis: RedisOptions;
  emailService: IEmailConfig;
  cookie_secret: string;
  cookie_refresh: string;
  throttler: ThrottlerModuleOptions;
  oauth: OAuthConfig;
}
