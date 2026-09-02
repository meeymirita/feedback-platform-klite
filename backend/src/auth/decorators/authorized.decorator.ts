import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { User } from '@/generated/prisma/client';

/**
 * Достаёт из запроса пользователя, которого проставил AuthGuard.
 * `@Authorized()` — весь объект, `@Authorized('id')` — конкретное поле.
 */
export const Authorized = createParamDecorator(
  (data: keyof Omit<User, 'password'>, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
