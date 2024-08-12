import { ApiProperty } from '@nestjs/swagger';

export class ResponseErrorDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}
