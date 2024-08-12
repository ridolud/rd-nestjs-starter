import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Origin } from 'src/auth/decorators/origin.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { AuthMessageResponseDto } from 'src/auth/dto/auth-message-response.dto';
import { AuthResponseDto } from 'src/auth/dto/auth-response.dto';
import { ConfirmEmailDto } from 'src/auth/dto/confirm-email.dto';
import { EmailDto } from 'src/auth/dto/email.dto';
import { PasswordDto } from 'src/auth/dto/password.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { UsersService } from 'src/users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @Post('/sign-up')
  @ApiCreatedResponse({
    type: AuthMessageResponseDto,
    description: 'The user has been created and is waiting confirmation',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  public async signUp(
    @Origin() origin: string | undefined,
    @Body() signUpDto: SignUpDto,
  ): Promise<AuthMessageResponseDto> {
    await this.authService.signUp(signUpDto, origin);

    return plainToInstance(AuthMessageResponseDto, {
      message: 'The user has been created and is waiting confirmation',
    });
  }

  @Public()
  @Post('/confirm-email')
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Confirms the user email and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async confirmEmail(
    @Origin() origin: string | undefined,
    @Body() confirmEmailDto: ConfirmEmailDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.confirmEmail(confirmEmailDto, origin);
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .json(result);
  }

  @Public()
  @Post('/sign-in')
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Logs in the user and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or User is not confirmed',
  })
  public async signIn(
    @Res() res: Response,
    @Origin() origin: string | undefined,
    @Body() singInDto: SignInDto,
  ): Promise<void> {
    const result = await this.authService.signIn(singInDto, origin);

    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .json(result);
  }

  @Public()
  @Post('/refresh-access')
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Refreshes and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async refreshAccess(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const result = await this.authService.refreshTokenAccess(
      token,
      req.headers.origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(result);
  }

  @Post('/logout')
  @ApiOkResponse({
    type: AuthMessageResponseDto,
    description: 'The user is logged out',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  public async logout(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const message = await this.authService.logout(token);

    res
      .clearCookie(this.cookieName, { path: this.cookiePath })
      .header('Content-Type', 'application/json')
      .status(HttpStatus.OK)
      .send(message);
  }

  @Public()
  @Post('/forgot-password')
  @ApiOkResponse({
    type: AuthMessageResponseDto,
    description:
      'An email has been sent to the user with the reset password link',
  })
  public async forgotPassword(
    @Origin() origin: string | undefined,
    @Body() emailDto: EmailDto,
  ): Promise<AuthMessageResponseDto> {
    await this.authService.resetPasswordEmail(emailDto, origin);
    return plainToInstance(AuthMessageResponseDto, {
      message: 'Reset password email sent',
    });
  }

  @Public()
  @Post('/reset-password')
  @ApiOkResponse({
    type: AuthMessageResponseDto,
    description: 'The password has been reset',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<AuthMessageResponseDto> {
    await this.authService.resetPassword(resetPasswordDto);
    return plainToInstance(AuthMessageResponseDto, {
      message: 'Password reset successfully',
    });
  }

  @Patch('/update-password')
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'The password has been updated',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async updatePassword(
    @CurrentUser() userId: string,
    @Origin() origin: string | undefined,
    @Body() changePasswordDto: PasswordDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.updatePassword(
      userId,
      changePasswordDto,
      origin,
    );

    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(result);
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiOkResponse({
    type: ResponseUserDto,
    description: 'The user is found and returned.',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async getMe(@CurrentUser() userId: string) {
    const user = await this.usersService.findOne(userId);
    return plainToInstance(ResponseUserDto, user);
  }

  private refreshTokenFromReq(req: Request): string {
    const token: string | undefined = req.signedCookies[this.cookieName];

    if (!token) {
      throw new UnauthorizedException();
    }

    return token;
  }

  private saveRefreshCookie(res: Response, refreshToken: string): Response {
    return res.cookie(this.cookieName, refreshToken, {
      secure: !this.testing,
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
      path: this.cookiePath,
      expires: new Date(Date.now() + this.refreshTime * 1000),
    });
  }
}
