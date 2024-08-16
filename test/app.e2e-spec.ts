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

describe('GraphQL AppResolver (e2e)', () => {
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
    role: 'USER',
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
    app.use(cookieParser(configService.get<string>('cookie_secret')));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
  });
  const gql = '/api/graphql';

  describe('auth', () => {
    describe('sign-up', () => {
      it('should create a new user', async () => {
        jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce({
          ...mockUser,
          password: await hash(mockUser.password, 10),
          confirmed: false,
        });

        const response = await request(app.getHttpServer())
          .post(gql)
          .send({
            query: `
              mutation {
                signUp(input: {
                  name: "${mockUser.name}",
                  email: "${mockUser.email}",
                  password: "${mockUser.password}",
                }) {
                  message
                }
              }
            `,
          });

        expect(response.body.data.signUp).toMatchObject({
          message: 'The user has been created and is waiting confirmation',
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
