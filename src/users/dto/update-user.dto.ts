import { InputType, PartialType } from '@nestjs/graphql';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@InputType()
export class UpdateUserDto extends PartialType(CreateUserDto) {}
