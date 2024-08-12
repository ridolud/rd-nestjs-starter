import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AllowRole } from 'src/auth/decorators/allow-role.decorator';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { FindUserDto } from 'src/users/dto/find-user.dto';
import { ResponseFindUsersDto } from 'src/users/dto/response-find-users.dto';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UsersService } from 'src/users/users.service';
import { ResponseErrorDto } from 'src/utils/dto/response-error.dto';

@ApiTags('Users')
@AllowRole('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiParam({ name: 'options', required: true, type: FindUserDto })
  @ApiOkResponse({
    type: ResponseFindUsersDto,
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
    type: ResponseErrorDto,
  })
  async find(@Query() options: FindUserDto): Promise<ResponseFindUsersDto> {
    const [total, records] = await this.usersService.find(options);

    return plainToInstance(ResponseFindUsersDto, {
      total,
      records,
    });
  }

  @Get(':id')
  @ApiOkResponse({
    type: ResponseUserDto,
  })
  @ApiNotFoundResponse({ type: ResponseErrorDto })
  async findOneById(@Param('id') id: string): Promise<ResponseUserDto> {
    const user = await this.usersService.findOne(id);
    return plainToInstance(ResponseUserDto, user);
  }

  @Post()
  @ApiOkResponse({
    type: ResponseUserDto,
  })
  async create(@Body() input: CreateUserDto): Promise<ResponseUserDto> {
    const user = await this.usersService.create(input);
    return plainToInstance(ResponseUserDto, user);
  }

  @Post(':id')
  @ApiOkResponse({
    type: ResponseUserDto,
  })
  async update(
    @Param('id') id: string,
    @Body() input: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    const user = await this.usersService.update(id, input);
    return plainToInstance(ResponseUserDto, user);
  }

  @Delete(':id')
  @ApiOkResponse({
    type: ResponseUserDto,
  })
  async delete(@Param('id') id: string): Promise<ResponseUserDto> {
    const user = await this.usersService.delete(id);
    return plainToInstance(ResponseUserDto, user);
  }
}
