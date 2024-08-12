import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { TokenTypeEnum } from 'src/jwt/types/token-type';

describe('AppController (e2e)', () => {
  let app: INestApplication,
    mailService: MailService,
    jwtService: JwtService,
    usersService: UsersService,
    prismaService: PrismaService;

  const mockUser: User = {
    id: randomUUID(),
    name: faker.person.fullName(),
    password: faker.internet.password(),
    email: faker.internet.email().toLowerCase(),
    createdAt: new Date(),
    confirmed: true,
    role: 'USER'
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    jwtService = app.get(JwtService);
    usersService = app.get(UsersService);
    prismaService = app.get(PrismaService);

    mailService = app.get(MailService);
    jest.spyOn(mailService, 'sendEmail').mockImplementation();

    const configService = app.get(ConfigService);
    app.use(cookieParser(configService.get<string>('COOKIE_SECRET')));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
  });

  describe('api/auth', () => {
    const baseUrl = '/api/auth';

    describe('sign-up', () => {
      const signUpUrl = `${baseUrl}/sign-up`;

      it('should throw 400 error if email is missing', async () => {
        jest
          .spyOn(prismaService.user, 'create')
          .mockRejectedValueOnce(new Error());
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name: faker.internet.displayName(),
            password: faker.internet.password(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if email is invalid', async () => {
        jest
          .spyOn(prismaService.user, 'create')
          .mockRejectedValueOnce(new Error());
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            email: 'test',
            name: faker.internet.displayName(),
            password: faker.internet.password(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password is too short', async () => {
        jest
          .spyOn(prismaService.user, 'create')
          .mockRejectedValueOnce(new Error());
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name: faker.internet.displayName(),
            email: faker.internet.email(),
            password: 'pass',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if name has symbols', async () => {
        jest
          .spyOn(prismaService.user, 'create')
          .mockRejectedValueOnce(new Error());
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            email: faker.internet.email(),
            name: 'name!',
            password: faker.internet.password(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should create a new user', async () => {
        jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce({
          ...mockUser,
          password: await hash(mockUser.password, 10),
          confirmed: false,
        });

        const response = await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name: mockUser.name,
            email: mockUser.email,
            password: mockUser.password,
          });

        expect(response.body).toMatchObject({
          message: 'The user has been created and is waiting confirmation',
        });
      });
    });

    describe('confirm-email', () => {
      const confirmEmailUrl = `${baseUrl}/confirm-email`;

      it('should throw 400 error if token is missing', async () => {
        await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if token is invalid', async () => {
        await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({
            confirmationToken: 'test',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should confirm the user', async () => {
        jest.spyOn(prismaService.user, 'update').mockResolvedValueOnce({
          ...mockUser,
          password: await hash(mockUser.password, 10),
        });

        const confirmationToken = await jwtService.generateToken(
          mockUser,
          TokenTypeEnum.CONFIRMATION,
        );

        const response = await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({
            confirmationToken,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });

    describe('sign-in', () => {
      const signInUrl = `${baseUrl}/sign-in`;

      it('should throw 400 error if email or username is missing', async () => {
        jest
          .spyOn(prismaService.user, 'findFirst')
          .mockRejectedValueOnce(new Error());

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            password: mockUser.password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password is missing', async () => {
        jest
          .spyOn(prismaService.user, 'findFirst')
          .mockRejectedValueOnce(new Error());

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            email: mockUser.email,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if email is invalid', async () => {
        jest
          .spyOn(prismaService.user, 'findFirst')
          .mockRejectedValueOnce(new Error());

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            email: 'test@test',
            password: mockUser.password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 401 error if user is not confirmed', async () => {
        jest.spyOn(prismaService.user, 'findFirst').mockResolvedValueOnce({
          ...mockUser,
          password: await hash(mockUser.password, 10),
          confirmed: false,
        });

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            email: mockUser.email,
            password: mockUser.password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should throw 401 error if password is incorrect', async () => {
        jest.spyOn(prismaService.user, 'findFirst').mockResolvedValueOnce({
          ...mockUser,
          password: await hash(mockUser.password, 10),
        });

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            email: mockUser.email,
            password: faker.internet.password(10),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should sign in the user with email', async () => {
        jest.spyOn(prismaService.user, 'findFirst').mockResolvedValueOnce({
          ...mockUser,
          password: await hash(mockUser.password, 10),
        });

        const response = await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            email: mockUser.email,
            password: mockUser.password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
