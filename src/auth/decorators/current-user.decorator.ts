import { createParamDecorator } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContextHost): number | undefined => {
    return context.switchToHttp().getRequest()?.user;
  },
);
