import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class PasswordDto {
  @Field()
  @IsString()
  @MinLength(8)
  password: string;
}
