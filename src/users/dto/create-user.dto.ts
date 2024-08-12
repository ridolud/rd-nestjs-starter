import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsString, IsOptional, Min, IsEmail, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ type: String })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(6)
  password: string;
}
