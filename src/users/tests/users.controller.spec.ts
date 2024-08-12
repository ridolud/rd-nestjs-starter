import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { $Enums, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import { UsersController } from 'src/users/users.controller';
import { plainToInstance } from 'class-transformer';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';

describe('UsersController', () => {
  let module: TestingModule;
  let controller: UsersController;
  let service: UsersService;
  const prismaServiceMock = {
    user: {
      findFirstOrThrow: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
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
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    controller = module.get<UsersController>(UsersController);
  });

  const mockUser1: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
    role: $Enums.UserRole.USER
  };

  const mockUser2: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
    role: $Enums.UserRole.USER
  };

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      prismaServiceMock.user.create.mockResolvedValueOnce(mockUser1);

      const user = await controller.create(mockUser1);
      expect(user).toBeDefined();
    });

    it('should throw a conflict exception', async () => {
      prismaServiceMock.user.create.mockRejectedValueOnce(new Error());

      await expect(service.create(mockUser1)).rejects.toThrow();
    });
  });

  describe('read', () => {
    it('should find users', async () => {
      prismaServiceMock.$transaction.mockResolvedValueOnce([
        2,
        [mockUser1, mockUser2],
      ]);

      const users = await controller.find({});
      expect(users.total).toEqual(2);
      expect(users.records).toEqual([
        plainToInstance(ResponseUserDto, mockUser1),
        plainToInstance(ResponseUserDto, mockUser2),
      ]);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      prismaServiceMock.user.update.mockResolvedValue({
        ...mockUser2,
        id: mockUser1.id,
      });
      const user = await controller.update(mockUser1.id, {
        email: mockUser2.email,
        name: mockUser2.name,
        password: mockUser2.password,
      });
      expect(user).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      prismaServiceMock.user.delete.mockResolvedValueOnce(mockUser1);
      const user = await controller.delete(mockUser1.id);
      expect(user).toBeDefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
