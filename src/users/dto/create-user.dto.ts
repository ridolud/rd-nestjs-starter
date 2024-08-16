import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsEmail, MinLength } from 'class-validator';

@InputType()
export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @Field()
  name: string;

  @IsEmail()
  @Field()
  email: string;

  @IsString()
  @MinLength(6)
  @Field()
  password: string;
}
