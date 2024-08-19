import { Module } from '@nestjs/common';
import { GoogleOAuthController } from 'src/auth/oauth/google/google-oauth.controller';
import { GoogleOAuthStrategy } from 'src/auth/oauth/google/google-oauth.strategy';

@Module({
  controllers: [GoogleOAuthController],
  providers: [GoogleOAuthStrategy],
})
export class GoogleOAuthModule {}
