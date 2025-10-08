import { IUserInfo } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: IUserInfo;
      sessionId?: string;
      permissions?: string[];
      rateLimit?: {
        limit: number;
        remaining: number;
        reset: Date;
        retryAfter?: number;
      };
    }
  }
}

export {}; 