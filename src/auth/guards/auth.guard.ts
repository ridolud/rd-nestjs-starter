import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { isJWT } from 'class-validator';
import { Request } from 'express';
import { ALLOW_ROLE_KEY } from 'src/auth/decorators/allow-role.decorator';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { JwtService } from 'src/jwt/jwt.service';
import { TokenTypeEnum } from 'src/jwt/types/token-type';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const allowRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ALLOW_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const ctx = GqlExecutionContext.create(context);
    const isAuteticated = await this.setHttpHeader(
      ctx.getContext().req,
      isPublic,
      allowRoles,
    );

    return isAuteticated;
  }

  private async setHttpHeader(
    req: Request,
    isPublic: boolean,
    allowRoles: UserRole[],
  ): Promise<boolean> {
    if (!!isPublic) return true;

    try {
      const auth = req.headers?.authorization;
      if (!auth) throw new Error("authorization's header not defined!");

      const authArr = auth.split(' ');
      const token = authArr[1];

      if (!auth || !token || !isJWT(token))
        throw new Error('token not defined!');

      const { id } = await this.jwtService.verifyToken(
        token,
        TokenTypeEnum.ACCESS,
      );
      req['user'] = id;

      const user = await this.usersService.findOne(id);
      if (!!allowRoles && !allowRoles.includes(user.role)) return false;

      return true;
    } catch (err) {
      this.logger.warn(err);
      throw new UnauthorizedException();
    }
  }
}
