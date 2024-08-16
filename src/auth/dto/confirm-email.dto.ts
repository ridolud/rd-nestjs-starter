import { ArgsType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsJWT } from 'class-validator';

@ArgsType()
export class ConfirmEmailDto {
  @Field()
  @IsString()
  @IsJWT()
  public confirmationToken!: string;
}
