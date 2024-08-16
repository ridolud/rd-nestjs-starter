import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { $Enums, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { UsersResolver } from 'src/users/users.resolver';

describe('UsersResolver', () => {
  let module: TestingModule;
  let resolver: UsersResolver;
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
      providers: [
        UsersService,
        UsersResolver,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    resolver = module.get<UsersResolver>(UsersResolver);
  });

  const mockUser1: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
    role: $Enums.UserRole.USER,
  };

  const mockUser2: User = {
    id: randomUUID(),
    name: faker.internet.displayName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    createdAt: new Date(),
    confirmed: true,
    role: $Enums.UserRole.USER,
  };

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      prismaServiceMock.user.create.mockResolvedValueOnce(mockUser1);

      const user = await resolver.createUser(mockUser1);
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

      const users = await resolver.users({ take: 20, skip: 0, search: '' });
      expect(users.total).toEqual(2);
      expect(users.records).toEqual([
        plainToInstance(ResponseUserDto, mockUser1),
        plainToInstance(ResponseUserDto, mockUser2),
      ]);
    });

    it('should get a user', async () => {
      prismaServiceMock.user.findUniqueOrThrow.mockResolvedValueOnce(mockUser1);

      await expect(resolver.user(mockUser1.id)).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      prismaServiceMock.user.update.mockResolvedValue({
        ...mockUser2,
        id: mockUser1.id,
      });
      const user = await resolver.updateUser(mockUser1.id, {
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
      const user = await resolver.deleteUser(mockUser1.id);
      expect(user).toBeDefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});
