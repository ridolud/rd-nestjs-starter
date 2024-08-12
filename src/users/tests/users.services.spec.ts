import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import { compare, hash } from 'bcrypt';

describe('UsersService', () => {
  let module: TestingModule;
  let service: UsersService;
  const prismaServiceMock = {
    user: {
      findFirstOrThrow: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(prismaServiceMock)),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  const dummyUser1: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
  };

  const dummyUser2: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
  };

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      prismaServiceMock.user.create.mockResolvedValueOnce(dummyUser1);

      const user = await service.create(dummyUser1);
      expect(user).toBeDefined();
    });

    it('should throw a conflict exception', async () => {
      prismaServiceMock.user.create.mockRejectedValueOnce(new Error());

      await expect(service.create(dummyUser1)).rejects.toThrow();
    });
  });

  describe('read', () => {
    it('should find users', async () => {
      prismaServiceMock.$transaction.mockResolvedValueOnce([
        2,
        [dummyUser1, dummyUser2],
      ]);

      const [total, records] = await service.find({});
      expect(total).toEqual(2);
      expect(records).toEqual([dummyUser1, dummyUser2]);
    });

    it('should find a user by id', async () => {
      prismaServiceMock.user.findUniqueOrThrow.mockResolvedValue(dummyUser1);
      const user = await service.findOne(dummyUser1.id);
      expect(user).toBeDefined();
    });

    it('should find a user by email', async () => {
      prismaServiceMock.user.findFirstOrThrow.mockResolvedValue(dummyUser1);

      const user = await service.findOneByEmail(dummyUser1.email);
      expect(user).toBeDefined();
    });

    describe('by credentials', () => {
      it('should find a user by credentials', async () => {
        const passwordHashed = await hash(dummyUser1.password, 10);
        prismaServiceMock.user.findFirst.mockResolvedValue({
          ...dummyUser1,
          password: passwordHashed,
        });

        const user = await service.findOneByCredentials(
          dummyUser1.email,
          dummyUser1.password,
        );
        expect(user).toBeDefined();
      });

      it('should throw an unauthorized exception', async () => {
        await expect(
          service.findOneByCredentials(dummyUser1.email, 'test-password'),
        ).rejects.toThrow();
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      prismaServiceMock.user.update.mockResolvedValue({
        ...dummyUser2,
        id: dummyUser1.id,
      });
      const user = await service.update(dummyUser1.id, {
        name: dummyUser2.name,
      });
      expect(user.name).toBeDefined();
    });

    it('should reset a user password', async () => {
      const passwordHashed = await hash('new-password', 10);
      prismaServiceMock.user.update.mockResolvedValue({
        ...dummyUser1,
        password: passwordHashed,
      });

      const user = await service.resetPassword(dummyUser1.id, 'new-password');
      expect(user).toBeDefined();
      expect(await compare('new-password', user.password)).toBe(true);
    });

    describe('email', () => {
      it('should update a user email', async () => {
        const newEmail = faker.internet.email();

        prismaServiceMock.user.update.mockResolvedValue({
          ...dummyUser1,
          email: newEmail.toLowerCase(),
        });

        const user = await service.updateEmail(dummyUser1.id, newEmail);
        expect(user.email).toEqual(newEmail.toLowerCase());
      });

      it('should throw a conflict exception', async () => {
        prismaServiceMock.user.update.mockRejectedValueOnce(new Error());

        await expect(
          service.updateEmail(dummyUser1.id, dummyUser2.email),
        ).rejects.toThrow();
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      prismaServiceMock.user.delete.mockResolvedValueOnce(dummyUser1);
      const user = await service.delete(dummyUser1.id);
      expect(user).toBeDefined();

      prismaServiceMock.user.findUniqueOrThrow.mockRejectedValueOnce(
        new Error(),
      );
      await expect(service.findOne(dummyUser1.id)).rejects.toThrow();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
