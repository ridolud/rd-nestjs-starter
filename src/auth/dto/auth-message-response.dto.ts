import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthMessageResponseDto {
  @Field()
  public message: string;
}
