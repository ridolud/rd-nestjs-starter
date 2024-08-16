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
  Args,
  Context,
  GqlExecutionContext,
  GraphQLExecutionContext,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
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

@Resolver('Auth')
export class AuthResolver {
  private readonly cookiePath = '/api/graphql';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    this.cookieName = this.configService.get<string>('cookie_refresh');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @Mutation(() => AuthMessageResponseDto)
  public async signUp(
    @Origin() origin: string | undefined,
    @Args('input') input: SignUpDto,
  ): Promise<AuthMessageResponseDto> {
    await this.authService.signUp(input, origin);

    return plainToInstance(AuthMessageResponseDto, {
      message: 'The user has been created and is waiting confirmation',
    });
  }

  @Public()
  @Mutation(() => AuthResponseDto)
  public async confirmEmail(
    @Origin() origin: string | undefined,
    @Args() input: ConfirmEmailDto,
    @Context('res') res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.confirmEmail(input, origin);
    this.saveRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Public()
  @Mutation(() => AuthResponseDto)
  public async signIn(
    @Context('res') res: Response,
    @Origin() origin: string | undefined,
    @Args('input') singInDto: SignInDto,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.signIn(singInDto, origin);
    this.saveRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Public()
  @Mutation(() => AuthResponseDto)
  public async refreshAccess(
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<AuthResponseDto> {
    const token = this.refreshTokenFromReq(req);
    const result = await this.authService.refreshTokenAccess(
      token,
      req.headers.origin,
    );

    this.saveRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Mutation(() => AuthMessageResponseDto)
  public async logout(
    @Context('req') req: Request,
    @Context('res') res: Response,
  ): Promise<AuthMessageResponseDto> {
    const token = this.refreshTokenFromReq(req);
    await this.authService.logout(token);

    res.clearCookie(this.cookieName, { path: this.cookiePath });

    return plainToInstance(AuthMessageResponseDto, {
      message: 'Logout successfully',
    });
  }

  @Public()
  @Mutation(() => AuthMessageResponseDto)
  public async forgotPassword(
    @Origin() origin: string | undefined,
    @Args('input') emailDto: EmailDto,
  ): Promise<AuthMessageResponseDto> {
    await this.authService.resetPasswordEmail(emailDto, origin);
    return plainToInstance(AuthMessageResponseDto, {
      message: 'Reset password email sent',
    });
  }

  @Public()
  @Mutation(() => AuthMessageResponseDto)
  public async resetPassword(
    @Args('input') resetPasswordDto: ResetPasswordDto,
  ): Promise<AuthMessageResponseDto> {
    await this.authService.resetPassword(resetPasswordDto);
    return plainToInstance(AuthMessageResponseDto, {
      message: 'Password reset successfully',
    });
  }

  @Mutation(() => AuthResponseDto)
  public async updatePassword(
    @CurrentUser() userId: string,
    @Origin() origin: string | undefined,
    @Args('input') changePasswordDto: PasswordDto,
    @Context('res') res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.updatePassword(
      userId,
      changePasswordDto,
      origin,
    );

    this.saveRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Query(() => ResponseUserDto, { name: 'profile' })
  public async getMe(@CurrentUser() userId: string): Promise<ResponseUserDto> {
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
    res.cookie(this.cookieName, refreshToken, {
      secure: !this.testing,
      httpOnly: true,
      sameSite: 'strict',
      signed: true,
      path: this.cookiePath,
      expires: new Date(Date.now() + this.refreshTime * 1000),
    });
    return res;
  }
}
