import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'User',
    type: ResponseUserDto,
  })
  @Type(() => ResponseUserDto)
  public user: ResponseUserDto;

  @ApiProperty({
    description: 'Access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    type: String,
  })
  public accessToken: string;

  @ApiProperty({
    description: 'Access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    type: String,
  })
  public refreshToken: string;
}
