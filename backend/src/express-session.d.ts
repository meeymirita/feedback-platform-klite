import 'express-session';
import type { User } from './generated/prisma/client';

declare module 'express-session' {
  /**
   * Расширяет SessionData: id залогиненного пользователя.
   */
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      /** Пользователь, которого проставляет AuthGuard (без поля password). */
      user?: Omit<User, 'password'>;
    }
  }
}
