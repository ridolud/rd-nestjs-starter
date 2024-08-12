import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { NAME_REGEX } from 'src/utils/consts/regex.const';

export class SignUpDto {
  @ApiProperty({
    example: 'example@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(NAME_REGEX)
  name: string;

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
