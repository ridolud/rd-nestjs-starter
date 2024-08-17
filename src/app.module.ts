import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from './config';
import { UsersModule } from 'src/users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig } from 'src/config/cache.config';
import { AuthModule } from 'src/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { JwtModule } from 'src/jwt/jwt.module';
import { MailModule } from 'src/mail/mail.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerConfig } from 'src/config/throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useClass: CacheConfig,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfig,
    }),
    AuthModule,
    JwtModule,
    MailModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
