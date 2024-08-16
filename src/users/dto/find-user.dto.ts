import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/utils/dto/pagination.dto';

@ArgsType()
export class FindUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Field({ nullable: true, defaultValue: '' })
  search: string;
}
