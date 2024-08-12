import { faker } from '@faker-js/faker';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { isJWT } from 'class-validator';
import { randomUUID } from 'crypto';
import { config } from 'src/config';
import { IAccessToken } from 'src/jwt/interfaces/access-token.interface';
import { IEmailToken } from 'src/jwt/interfaces/email-token.interface';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/types/token-type';
import { promisify } from 'util';
import { sign } from 'jsonwebtoken';
import { IRefreshToken } from 'src/jwt/interfaces/refresh-token.interface';

describe('JwtService', () => {
  let module: TestingModule;
  let service: JwtService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [config] })],
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  const mockUser1: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
    role: 'USER',
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('access tokens', () => {
    let token: string;

    it('should generate a token', async () => {
      token = await service.generateToken(mockUser1, TokenTypeEnum.ACCESS);
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should verify a token', async () => {
      const decoded = await service.verifyToken<IAccessToken>(
        token,
        TokenTypeEnum.ACCESS,
      );
      expect(decoded).toBeDefined();
      expect(decoded.id).toEqual(mockUser1.id);
      expect(decoded.sub).toEqual(mockUser1.email);
      expect(decoded.aud).toEqual(config().domain);
      expect(decoded.iss).toEqual(config().domain);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw an error if the token is invalid', async () => {
      const invalidToken = token + 'invalid';
      await expect(
        service.verifyToken<IAccessToken>(invalidToken, TokenTypeEnum.ACCESS),
      ).rejects.toThrow('Invalid token');
    });

    it('should throw an error if the token is expired', async () => {
      const expiredToken = sign(
        {
          id: mockUser1.id,
          version: 1,
        },
        config().jwt.confirmation.secret,
        {
          expiresIn: 1,
          issuer: config().domain,
          audience: config().domain,
          subject: mockUser1.email,
        },
      );
      const timeout = promisify(setTimeout);
      await timeout(1001);
      await expect(
        service.verifyToken<IEmailToken>(
          expiredToken,
          TokenTypeEnum.CONFIRMATION,
        ),
      ).rejects.toThrow('Token expired');
    });
  });

  describe('refresh tokens', () => {
    let token: string;

    it('should generate a token', async () => {
      token = await service.generateToken(mockUser1, TokenTypeEnum.REFRESH);
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should verify a token', async () => {
      const decoded = await service.verifyToken<IRefreshToken>(
        token,
        TokenTypeEnum.REFRESH,
      );
      expect(decoded).toBeDefined();
      expect(decoded.id).toEqual(mockUser1.id);
      expect(decoded.tokenId).toBeDefined();
      expect(decoded.sub).toEqual(mockUser1.email);
      expect(decoded.aud).toEqual(config().domain);
      expect(decoded.iss).toEqual(config().domain);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw an error if the token is invalid', async () => {
      const invalidToken = token + 'invalid';
      await expect(
        service.verifyToken<IRefreshToken>(invalidToken, TokenTypeEnum.REFRESH),
      ).rejects.toThrow('Invalid token');
    });
  });

  describe('confirmation tokens', () => {
    let token: string;

    it('should generate a token', async () => {
      token = await service.generateToken(
        mockUser1,
        TokenTypeEnum.CONFIRMATION,
      );
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should verify a token', async () => {
      const decoded = await service.verifyToken<IEmailToken>(
        token,
        TokenTypeEnum.CONFIRMATION,
      );
      expect(decoded).toBeDefined();
      expect(decoded.id).toEqual(mockUser1.id);
      expect(decoded.sub).toEqual(mockUser1.email);
      expect(decoded.aud).toEqual(config().domain);
      expect(decoded.iss).toEqual(config().domain);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw an error if the token is invalid', async () => {
      const invalidToken = token + 'invalid';
      await expect(
        service.verifyToken<IEmailToken>(
          invalidToken,
          TokenTypeEnum.CONFIRMATION,
        ),
      ).rejects.toThrow('Invalid token');
    });
  });
});
