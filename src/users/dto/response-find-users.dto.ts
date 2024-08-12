import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { IPaginate } from 'src/utils/interfaces/paginate.interface';

export class ResponseFindUsersDto implements IPaginate<ResponseFindUsersDto> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  @Type(() => ResponseUserDto)
  records: ResponseFindUsersDto[];
}
