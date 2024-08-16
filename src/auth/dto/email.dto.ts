import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

@InputType()
export class EmailDto {
  @Field()
  @IsEmail()
  email: string;
}
