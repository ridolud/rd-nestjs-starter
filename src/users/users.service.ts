import { BadRequestException, Injectable } from '@nestjs/common';
import { $Enums, Prisma, User } from '@prisma/client';
import defu from 'defu';
import { compare, hash } from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindUserDto } from 'src/users/dto/find-user.dto';
import { th } from '@faker-js/faker';
import { OAuthProviderType } from 'src/auth/oauth/types/oauth';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async find(options: FindUserDto): Promise<[number, User[]]> {
    options = defu(options, { take: 20, skip: 0, search: '' });

    const query: Prisma.UserWhereInput = {
      OR: [
        { email: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ],
    };

    return await this.prismaService.$transaction([
      this.prismaService.user.count({ where: query }),
      this.prismaService.user.findMany({
        where: query,
        skip: options.skip,
        take: options.take,
      }),
    ]);
  }

  async create(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return await this.prismaService.user.create({
      data: {
        name: input.name.toLowerCase(),
        email: input.email.toLowerCase(),
        password: await hash(input.password, 10),
        role: $Enums.UserRole.USER,
      },
    });
  }

  async findOne(id: string): Promise<User> {
    return await this.prismaService.user.findUniqueOrThrow({
      where: { id },
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { email },
    });
    return user;
  }

  async findOrCreate(input: {
    provider: OAuthProviderType;
    email: string;
    name: string;
    password?: string;
  }): Promise<User> {
    let user: User;
    user = await this.prismaService.user.upsert({
      where: { email: input.email.toLowerCase() },
      update: {
        oauthProviders: {
          connectOrCreate: {
            where: {
              provider_email: {
                provider: input.provider,
                email: input.email.toLowerCase(),
              },
            },
            create: {
              provider: input.provider,
            },
          },
        },
      },
      create: {
        name: input.name.toLowerCase(),
        email: input.email.toLowerCase(),
        password: !input.password ? 'UNSET' : await hash(input.password, 10),
        role: $Enums.UserRole.USER,
        oauthProviders: {
          create: {
            provider: input.provider,
          },
        },
      },
    });
    return user;
  }

  async update(
    id: string,
    input: {
      name?: string;
      role?: $Enums.UserRole;
    },
  ): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data: {
        name: input.name,
        role: input.role,
      },
    });
  }

  async delete(id: string) {
    return await this.prismaService.user.delete({
      where: { id },
    });
  }

  async confirmEmail(id: string): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data: { confirmed: true },
    });
  }

  async updateEmail(id: string, email: string): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data: { confirmed: false, email: email.toLowerCase() },
    });
  }

  async resetPassword(id: string, password: string): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data: { password: await hash(password, 10) },
    });
  }

  async findOneByCredentials(
    idOrEmail: string,
    password: string,
  ): Promise<User> {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ id: idOrEmail }, { email: idOrEmail.toLowerCase() }],
      },
    });
    if (!user || !(await compare(password, user.password)))
      throw new BadRequestException('Credential Invalid');

    return user;
  }
}
