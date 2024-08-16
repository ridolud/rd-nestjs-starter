import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthResolver } from 'src/auth/auth.resolver';
import { AuthService } from 'src/auth/auth.service';
import { IJwt } from 'src/config/interfaces/jwt-config.interface';
import { JwtModule } from 'src/jwt/jwt.module';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [JwtModule, UsersModule, MailModule],
  providers: [AuthService, AuthResolver],
})
export class AuthModule {}
