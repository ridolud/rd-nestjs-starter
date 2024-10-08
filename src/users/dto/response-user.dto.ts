import { ApiProperty } from '@nestjs/swagger';
import { $Enums, User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class ResponseUserDto implements User {
  
  @ApiProperty()
  name: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty()
  confirmed: boolean;

  @IsEnum($Enums.UserRole)
  role: $Enums.UserRole;
}
