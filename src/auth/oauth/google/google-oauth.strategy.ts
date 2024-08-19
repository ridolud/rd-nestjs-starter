import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { OAuthConfig } from 'src/config/interfaces/oauth-config.interface';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientOptions = configService.getOrThrow<OAuthConfig>('oauth').GOOGLE;

    super({
      clientID: clientOptions.id,
      clientSecret: clientOptions.secret,
      callbackURL: `${configService.get('domain')}/api/auth/ext/google/redirect`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<Profile> {
    return profile;
  }
}
