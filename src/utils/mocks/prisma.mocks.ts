export const prismaServiceMock = {
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
