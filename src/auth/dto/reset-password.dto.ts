import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsJWT, MinLength } from 'class-validator';
import { PasswordDto } from 'src/auth/dto/password.dto';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The JWT token sent to the user email',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    type: String,
  })
  @IsString()
  @IsJWT()
  public resetToken!: string;

  @ApiProperty({
    example: 'new password',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
