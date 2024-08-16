import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import { AllowRole } from 'src/auth/decorators/allow-role.decorator';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { FindUserDto } from 'src/users/dto/find-user.dto';
import { ResponseFindUsersDto } from 'src/users/dto/response-find-users.dto';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UsersService } from 'src/users/users.service';

@Resolver('Users')
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => ResponseFindUsersDto)
  @AllowRole('ADMIN')
  async users(@Args() options: FindUserDto): Promise<ResponseFindUsersDto> {
    const [total, records] = await this.usersService.find(options);

    return plainToInstance(ResponseFindUsersDto, {
      total,
      records,
    });
  }

  @Query(() => ResponseUserDto)
  @AllowRole('ADMIN')
  async user(@Args('id') id: string): Promise<ResponseUserDto> {
    const user = await this.usersService.findOne(id);
    return plainToInstance(ResponseUserDto, user);
  }

  @Mutation(() => ResponseUserDto)
  @AllowRole('ADMIN')
  async createUser(
    @Args('input') input: CreateUserDto,
  ): Promise<ResponseUserDto> {
    const user = await this.usersService.create(input);
    return plainToInstance(ResponseUserDto, user);
  }

  @Mutation(() => ResponseUserDto)
  @AllowRole('ADMIN')
  async updateUser(
    @Args('id') id: string,
    @Args('input') input: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    const user = await this.usersService.update(id, input);
    return plainToInstance(ResponseUserDto, user);
  }

  @Mutation(() => ResponseUserDto)
  @AllowRole('ADMIN')
  async deleteUser(@Args('id') id: string): Promise<ResponseUserDto> {
    const user = await this.usersService.delete(id);
    return plainToInstance(ResponseUserDto, user);
  }
}
