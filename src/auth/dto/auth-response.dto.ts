import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';

@ObjectType()
export class AuthResponseDto {
  @Field()
  @Type(() => ResponseUserDto)
  public user: ResponseUserDto;

  @Field()
  public accessToken: string;

  @Field()
  public refreshToken: string;
}
