import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PasswordDto {
  @ApiProperty({
    example: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
