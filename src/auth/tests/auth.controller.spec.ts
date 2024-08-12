import { faker } from '@faker-js/faker';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { $Enums, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { config } from 'src/config';
import { JwtModule } from 'src/jwt/jwt.module';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/types/token-type';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { createRequestMock } from 'src/utils/mocks/request.mock';
import { createResponseMock } from 'src/utils/mocks/response.mock';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { prismaServiceMock } from 'src/utils/mocks/prisma.mocks';
import { HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let module: TestingModule,
    mailService: MailService,
    jwtService: JwtService,
    controller: AuthController,
    origin: string,
    cookieName: string;

  const mockUser: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email().toLowerCase(),
    createdAt: new Date(),
    confirmed: true,
    role: $Enums.UserRole.USER
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: parseInt(process.env.JWT_REFRESH_TIME, 10),
        }),
        JwtModule,
        MailModule,
        //   ThrottlerModule.forRootAsync({
        //     imports: [ConfigModule],
        //     useClass: ThrottlerConfig,
        //   }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    controller = module.get<AuthController>(AuthController);

    jest.spyOn(mailService, 'sendEmail').mockImplementation();
    jest.spyOn(mailService, 'sendResetPasswordEmail').mockImplementation();

    const _user = {
      ...mockUser,
      password: await hash(mockUser.password, 10),
    };
    jest
      .spyOn(prismaServiceMock.user, 'findUniqueOrThrow')
      .mockResolvedValue(_user);
    jest
      .spyOn(prismaServiceMock.user, 'findFirstOrThrow')
      .mockResolvedValue(_user);
    jest.spyOn(prismaServiceMock.user, 'findFirst').mockResolvedValue(_user);

    const configService = module.get<ConfigService>(ConfigService);
    origin = configService.get<string>('domain');
    cookieName = configService.get<string>('REFRESH_COOKIE');
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(mailService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a user and return a message', async () => {
      const name = faker.internet.displayName();
      const password = faker.internet.password();
      const email = faker.internet.email().toLowerCase();

      jest.spyOn(prismaServiceMock.user, 'create').mockResolvedValueOnce({
        ...mockUser,
        name,
        email,
        password: await hash(password, 10),
      });

      const message = await controller.signUp(origin, {
        name,
        email,
        password,
      });
      expect(message.message).toBe(
        'The user has been created and is waiting confirmation',
      );
    });

    it('should throw a ConflictException if the email is already in use', async () => {
      jest
        .spyOn(prismaServiceMock.user, 'create')
        .mockRejectedValueOnce(new Error('Email already registered!'));

      await expect(
        controller.signUp(origin, {
          email: mockUser.email,
          name: mockUser.name,
          password: mockUser.password,
        }),
      ).rejects.toThrow('Email already registered!');
    });
  });

  describe('confirm email', () => {
    const res = createResponseMock();

    it('should throw a BadRequestException if the token is invalid', async () => {
      await expect(
        controller.confirmEmail(
          origin,
          {
            confirmationToken: 'invalid',
          },
          res,
        ),
      ).rejects.toThrow('Invalid token');
    });

    it('should create json a response if token is valid', async () => {
      jest.spyOn(prismaServiceMock.user, 'update').mockResolvedValueOnce({
        ...mockUser,
        password: await hash(mockUser.password, 10),
      });

      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.CONFIRMATION,
      );
      await controller.confirmEmail(origin, { confirmationToken: token }, res);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe('sign in', () => {
    const res = createResponseMock();

    it('should throw a invalid credentials if email is wrong', async () => {
      jest
        .spyOn(prismaServiceMock.user, 'findFirst')
        .mockResolvedValueOnce(null);

      await expect(
        controller.signIn(res, origin, {
          email: faker.internet.email(),
          password: mockUser.password,
        }),
      ).rejects.toThrow('Credential Invalid');
    });

    it('should throw a invalid credentials if password is wrong', async () => {
      await expect(
        controller.signIn(res, origin, {
          email: mockUser.email,
          password: faker.internet.password(),
        }),
      ).rejects.toThrowError('Credential Invalid');
    });

    it('should sign in user', async () => {
      await controller.signIn(res, origin, {
        email: mockUser.email,
        password: mockUser.password,
      });
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw an UnauthorizedException if the user is not confirmed', async () => {
      jest.spyOn(prismaServiceMock.user, 'findFirst').mockResolvedValue({
        ...mockUser,
        confirmed: false,
        password: await hash(mockUser.password, 10),
      });

      await expect(
        controller.signIn(res, origin, {
          email: mockUser.email,
          password: mockUser.password,
        }),
      ).rejects.toThrow('Please confirm your email, a new email has been sent');
    });
  });

  describe('refresh access', () => {
    const req = createRequestMock();
    const res = createResponseMock();

    it('should throw a UnauthorizedException if there is no token', async () => {
      await expect(controller.refreshAccess(req, res)).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should throw a UnauthorizedException if the token is invalid', async () => {
      req.setCookie(cookieName, 'invalid');
      await expect(controller.refreshAccess(req, res)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should refresh token', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.REFRESH,
      );

      req.setCookie(cookieName, token);
      await controller.refreshAccess(req, res);

      expect(res.cookie).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    const req = createRequestMock();
    const res = createResponseMock();

    it('should throw a UnauthorizedException if there is no token', async () => {
      await expect(controller.logout(req, res)).rejects.toThrow('Unauthorized');
    });

    it('should throw a UnauthorizedException if the token is invalid', async () => {
      req.setCookie(cookieName, 'invalid');
      await expect(controller.logout(req, res)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should logout user', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.REFRESH,
      );
      req.setCookie(cookieName, token);
      await controller.logout(req, res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe('forgot password', () => {
    it('should trow a NotFoundException if user does not exists', async () => {
      jest
        .spyOn(prismaServiceMock.user, 'findFirstOrThrow')
        .mockRejectedValueOnce(new Error());

      await expect(
        controller.forgotPassword(origin, {
          email: faker.internet.email(),
        }),
      ).rejects.toThrow();
    });

    it('should send an email if user exists', async () => {
      const message = await controller.forgotPassword(origin, {
        email: mockUser.email,
      });
      expect(message).toBeDefined();
      expect(message.message).toBe('Reset password email sent');
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalled();
    });
  });

  describe('reset password', () => {
    it('should throw a BadRequestException if the token is invalid', async () => {
      const password = faker.internet.password();
      await expect(
        controller.resetPassword({
          resetToken: 'invalid',
          newPassword: password,
        }),
      ).rejects.toThrow('Invalid token');
    });

    it('should reset the password', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.RESET_PASSWORD,
      );
      const message = await controller.resetPassword({
        resetToken: token,
        newPassword: faker.internet.password(),
      });
      expect(message).toBe;
      expect(message.message).toBe('Password reset successfully');
    });
  });

  describe('update password', () => {
    const res = createResponseMock();

    it('should change the password', async () => {
      const newPassword = faker.internet.password();
      await controller.updatePassword(
        mockUser.id,
        origin,
        {
          password: newPassword,
        },
        res,
      );
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should get a user', async () => {
      const user = await controller.getMe(mockUser.id);
      expect(user.id).toBeDefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
