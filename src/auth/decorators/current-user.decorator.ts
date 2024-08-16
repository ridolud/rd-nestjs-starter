import { createParamDecorator } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContextHost): number | undefined => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
