import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { NAME_REGEX } from 'src/utils/consts/regex.const';

@InputType()
export class SignUpDto {
  @IsEmail()
  @Field()
  email: string;

  @IsString()
  @Matches(NAME_REGEX)
  @Field()
  name: string;

  @IsString()
  @MinLength(8)
  @Field()
  password: string;
}
