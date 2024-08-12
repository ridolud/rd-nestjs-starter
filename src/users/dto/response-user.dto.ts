import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

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
}
