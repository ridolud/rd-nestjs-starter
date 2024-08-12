import { IJwt } from 'src/config/interfaces/jwt-config.interface';
import { RedisOptions } from 'ioredis';
import { IEmailConfig } from 'src/config/interfaces/email-config.interface';

export interface IConfig {
  port: number;
  domain: string;
  testing: boolean;
  jwt: IJwt;
  redis: RedisOptions;
  emailService: IEmailConfig;
}
