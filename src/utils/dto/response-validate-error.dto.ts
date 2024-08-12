import { ApiProperty } from '@nestjs/swagger';
import { ResponseErrorDto } from 'src/utils/dto/response-error.dto';

export class ResponseValidateErrorDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string[];
}
