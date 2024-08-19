import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { GoogleOAuthModule } from 'src/auth/oauth/google/google-oauth.module';
import { IJwt } from 'src/config/interfaces/jwt-config.interface';
import { JwtModule } from 'src/jwt/jwt.module';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';

@Global()
@Module({
  imports: [
    JwtModule,
    UsersModule,
    MailModule,
    PassportModule,
    GoogleOAuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
