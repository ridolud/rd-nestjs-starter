import { ApiProperty } from '@nestjs/swagger';

export class AuthMessageResponseDto {
  @ApiProperty({
    description: 'Message',
    example: 'Hello World',
    type: String,
  })
  public message: string;
}
