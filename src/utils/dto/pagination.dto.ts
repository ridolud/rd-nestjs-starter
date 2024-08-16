import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsNumber, IsNumberString, IsOptional } from 'class-validator';

@ArgsType()
export class PaginationDto {
  @IsNumber()
  @IsOptional()
  @Field((type) => Int, { nullable: true, defaultValue: 0 })
  skip: number;

  @IsNumber()
  @IsOptional()
  @Field((type) => Int, { nullable: true, defaultValue: 20 })
  take: number;
}
