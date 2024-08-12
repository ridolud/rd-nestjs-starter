import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { PasswordDto } from 'src/auth/dto/password.dto';

export class SignInDto {
  @ApiProperty({
    example: 'example@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
