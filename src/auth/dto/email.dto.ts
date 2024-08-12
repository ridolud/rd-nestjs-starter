import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailDto {
  @ApiProperty({
    example: 'example@email.com',
  })
  @IsEmail()
  email: string;
}
