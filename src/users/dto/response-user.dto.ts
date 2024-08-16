import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { $Enums, User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsEnum } from 'class-validator';

@ObjectType({ description: 'User' })
export class ResponseUserDto implements User {
  @Field((type) => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  createdAt: Date;

  @Field()
  email: string;

  @Exclude()
  password: string;

  @Field()
  confirmed: boolean;

  @IsEnum($Enums.UserRole)
  @Field()
  role: $Enums.UserRole;
}
