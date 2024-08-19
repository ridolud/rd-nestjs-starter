import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Profile } from 'passport-google-oauth20';
import { AuthService } from 'src/auth/auth.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { GoogleOAuthGuard } from 'src/auth/oauth/google/google-oauth.guard';

@ApiTags('OAuth/Google')
@Controller('auth/ext/google')
export class GoogleOAuthController {
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.cookieName = this.configService.get<string>('cookie_refresh');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @Get()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() _req) {
    // Guard redirects
  }

  @Public()
  @Get('redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as Profile;
    const result = await this.authService.signInWith(
      'GOOGLE',
      user.name.givenName,
      user.emails[0].value,
    );
    res
      .cookie(this.cookieName, result.refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        sameSite: 'strict',
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .redirect(`http://localhost:3000?token=${result.accessToken}`);
  }
}
