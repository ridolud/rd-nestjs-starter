import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { AuthResponseDto } from 'src/auth/dto/auth-response.dto';
import { ConfirmEmailDto } from 'src/auth/dto/confirm-email.dto';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { IEmailToken } from 'src/jwt/interfaces/email-token.interface';
import { IRefreshToken } from 'src/jwt/interfaces/refresh-token.interface';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/types/token-type';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import dayjs from 'dayjs';
import { compare } from 'bcrypt';
import { EmailDto } from 'src/auth/dto/email.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { PasswordDto } from 'src/auth/dto/password.dto';
import { OAuthProviderType } from 'src/auth/oauth/types/oauth';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  public async signUp(input: SignUpDto, domain?: string): Promise<void> {
    const { name, email, password } = input;
    const user = await this.usersService.create({ name, email, password });

    const confirmationToken = await this.jwtService.generateToken(
      user,
      TokenTypeEnum.CONFIRMATION,
      domain,
    );

    this.mailService.sendConfirmationEmail(user, confirmationToken);
  }

  public async confirmEmail(
    input: ConfirmEmailDto,
    domain?: string,
  ): Promise<AuthResponseDto> {
    const { confirmationToken } = input;
    const { id } = await this.jwtService.verifyToken<IEmailToken>(
      confirmationToken,
      TokenTypeEnum.CONFIRMATION,
    );
    const user = await this.usersService.confirmEmail(id);
    const [accessToken, refreshToken] = await this.generateAuthTokens(
      user,
      domain,
    );
    return plainToInstance(AuthResponseDto, {
      user,
      accessToken,
      refreshToken,
    });
  }

  public async signIn(
    input: SignInDto,
    domain?: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = input;
    const user = await this.usersService.findOneByCredentials(email, password);

    if (!user.confirmed) {
      const confirmationToken = await this.jwtService.generateToken(
        user,
        TokenTypeEnum.CONFIRMATION,
        domain,
      );

      this.mailService.sendConfirmationEmail(user, confirmationToken);

      throw new UnauthorizedException(
        'Please confirm your email, a new email has been sent',
      );
    }

    const [accessToken, refreshToken] = await this.generateAuthTokens(
      user,
      domain,
    );

    return plainToInstance(AuthResponseDto, {
      user,
      accessToken,
      refreshToken,
    });
  }

  public async signInWith(
    provider: OAuthProviderType,
    name: string,
    email: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.findOrCreate({
      email,
      provider,
      name,
    });

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);

    return plainToInstance(AuthResponseDto, {
      user,
      accessToken,
      refreshToken,
    });
  }

  public async refreshTokenAccess(
    refreshToken: string,
    domain?: string,
  ): Promise<AuthResponseDto> {
    const { id, tokenId } = await this.jwtService.verifyToken<IRefreshToken>(
      refreshToken,
      TokenTypeEnum.REFRESH,
    );
    await this.checkIfTokenIsBlacklisted(id, tokenId);
    const user = await this.usersService.findOne(id);
    const [accessToken, newRefreshToken] = await this.generateAuthTokens(
      user,
      domain,
      tokenId,
    );
    return plainToInstance(AuthResponseDto, {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    });
  }

  public async logout(refreshToken: string): Promise<void> {
    const { id, tokenId, exp } =
      await this.jwtService.verifyToken<IRefreshToken>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      );
    await this.blacklistToken(id, tokenId, exp);
  }

  public async resetPasswordEmail(
    input: EmailDto,
    domain?: string,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOneByEmail(input.email);
      if (!user) return;

      const resetToken = await this.jwtService.generateToken(
        user,
        TokenTypeEnum.RESET_PASSWORD,
        domain,
      );

      this.mailService.sendResetPasswordEmail(user, resetToken);
      return;
    } catch (_) {
      return;
    }
  }

  public async resetPassword(input: ResetPasswordDto): Promise<void> {
    const { newPassword, resetToken } = input;
    const { id } = await this.jwtService.verifyToken<IEmailToken>(
      resetToken,
      TokenTypeEnum.RESET_PASSWORD,
    );

    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('user not found!');

    await this.usersService.resetPassword(user.id, newPassword);
  }

  public async updatePassword(
    userId: string,
    dto: PasswordDto,
    domain?: string,
  ): Promise<AuthResponseDto> {
    const { password } = dto;

    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('user not found!');

    await this.usersService.resetPassword(user.id, password);
    const [accessToken, refreshToken] = await this.generateAuthTokens(
      user,
      domain,
    );

    return plainToInstance(AuthResponseDto, {
      user,
      accessToken,
      refreshToken,
    });
  }

  private async checkIfTokenIsBlacklisted(
    userId: string,
    tokenId: string,
  ): Promise<void> {
    const time = await this.cacheManager.get<number>(
      `blacklist:${userId}:${tokenId}`,
    );

    if (time) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async blacklistToken(
    userId: string,
    tokenId: string,
    exp: number,
  ): Promise<void> {
    const now = dayjs().unix();
    const ttl = (exp - now) * 1000;

    if (ttl > 0) {
      await this.cacheManager.set(`blacklist:${userId}:${tokenId}`, now, ttl);
    }
  }

  private async generateAuthTokens(
    user: User,
    domain?: string,
    tokenId?: string,
  ): Promise<[string, string]> {
    return Promise.all([
      this.jwtService.generateToken(
        user,
        TokenTypeEnum.ACCESS,
        domain,
        tokenId,
      ),
      this.jwtService.generateToken(
        user,
        TokenTypeEnum.REFRESH,
        domain,
        tokenId,
      ),
    ]);
  }
}
