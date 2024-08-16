import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsJWT, MinLength } from 'class-validator';

@InputType()
export class ResetPasswordDto {
  @Field()
  @IsString()
  @IsJWT()
  public resetToken!: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
