import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { IPaginate } from 'src/utils/interfaces/paginate.interface';

@ObjectType()
export class ResponseFindUsersDto implements IPaginate<ResponseUserDto> {
  @Field()
  total: number;

  @Field((type) => [ResponseUserDto])
  @Type(() => ResponseUserDto)
  records: ResponseUserDto[];
}
