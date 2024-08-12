import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IJwt } from 'src/config/interfaces/jwt-config.interface';
import {
  IAccessPayload,
  IAccessToken,
} from 'src/jwt/interfaces/access-token.interface';
import {
  IEmailPayload,
  IEmailToken,
} from 'src/jwt/interfaces/email-token.interface';
import {
  IRefreshPayload,
  IRefreshToken,
} from 'src/jwt/interfaces/refresh-token.interface';
import * as jwt from 'jsonwebtoken';
import { TokenTypeEnum } from 'src/jwt/types/token-type';
import { v4 } from 'uuid';
import { User } from '@prisma/client';

@Injectable()
export class JwtService {
  private config: IJwt;
  private readonly issuer: string;
  private readonly domain: string;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<IJwt>('jwt');
    this.issuer = this.configService.get('domain');
    this.domain = this.configService.get('domain');
  }

  private static async generateTokenAsync(
    payload: IAccessPayload | IEmailPayload | IRefreshPayload,
    secret: string,
    options: jwt.SignOptions,
  ): Promise<string> {
    return new Promise((resolve, rejects) => {
      jwt.sign(payload, secret, options, (error, token) => {
        if (error) {
          rejects(error);
          return;
        }
        resolve(token);
      });
    });
  }

  private static async verifyTokenAsync<T>(
    token: string,
    secret: string,
    options: jwt.VerifyOptions,
  ): Promise<T> {
    return new Promise((resolve, rejects) => {
      jwt.verify(token, secret, options, (error, payload: T) => {
        if (error) {
          rejects(error);
          return;
        }
        resolve(payload);
      });
    });
  }

  private static async throwBadRequest<
    T extends IAccessToken | IRefreshToken | IEmailToken,
  >(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestException('Invalid token');
      }
      throw new InternalServerErrorException(error);
    }
  }

  public async generateToken(
    user: User,
    tokenType: TokenTypeEnum,
    domain?: string | null,
    tokenId?: string,
  ): Promise<string> {
    const jwtOptions: jwt.SignOptions = {
      issuer: this.issuer,
      subject: user.email,
      audience: domain ?? this.domain,
      algorithm: 'HS256',
    };

    let token: string;

    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        const { secret: accessSecret, time: accessTime } = this.config.access;
        token = await JwtService.generateTokenAsync(
          { id: user.id },
          accessSecret,
          {
            ...jwtOptions,
            expiresIn: accessTime,
          },
        );
        break;

      case TokenTypeEnum.REFRESH:
        const { secret: refreshSecret, time: refreshTime } =
          this.config.refresh;
        token = await JwtService.generateTokenAsync(
          {
            id: user.id,
            tokenId: tokenId ?? v4(),
          },
          refreshSecret,
          {
            ...jwtOptions,
            expiresIn: refreshTime,
          },
        );
        break;
      case TokenTypeEnum.CONFIRMATION:
      case TokenTypeEnum.RESET_PASSWORD:
        const { secret, time } = this.config[tokenType];
        token = await JwtService.generateTokenAsync({ id: user.id }, secret, {
          ...jwtOptions,
          expiresIn: time,
        });
        break;
    }

    return token;
  }

  public async verifyToken<
    T extends IAccessToken | IRefreshToken | IEmailToken,
  >(token: string, tokenType: TokenTypeEnum): Promise<T> {
    const jwtOptions: jwt.VerifyOptions = {
      issuer: this.issuer,
      audience: new RegExp(this.domain),
      algorithms: ['HS256'],
    };

    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        const { secret: accessSecret, time: accessTime } = this.config.access;
        return JwtService.throwBadRequest(
          JwtService.verifyTokenAsync(token, accessSecret, {
            ...jwtOptions,
            maxAge: accessTime,
          }),
        );
      case TokenTypeEnum.REFRESH:
      case TokenTypeEnum.CONFIRMATION:
      case TokenTypeEnum.RESET_PASSWORD:
        const { secret, time } = this.config[tokenType];
        return JwtService.throwBadRequest(
          JwtService.verifyTokenAsync(token, secret, {
            ...jwtOptions,
            maxAge: time,
          }),
        );
    }
  }

  public async generateAuthTokens(
    user: User,
    domain?: string,
    tokenId?: string,
  ): Promise<[string, string]> {
    return Promise.all([
      this.generateToken(user, TokenTypeEnum.ACCESS, domain, tokenId),
      this.generateToken(user, TokenTypeEnum.REFRESH, domain, tokenId),
    ]);
  }
}
