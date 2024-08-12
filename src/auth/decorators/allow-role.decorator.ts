import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client'

export const ALLOW_ROLE_KEY = 'allowRole';
export const AllowRole = (...roles: UserRole []) => SetMetadata(ALLOW_ROLE_KEY, roles);
