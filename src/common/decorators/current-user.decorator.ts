import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Dealer, User } from '@prisma/client';

export type AuthUser = User & {
  roles: { role: { slug: string } }[];
  dealer: Dealer | null;
  permissionSlugs: string[];
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return req.user;
  },
);
