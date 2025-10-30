import { IUserInfo } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: IUserInfo;
      sessionId?: string;
      permissions?: string[];
      activeRole?: string; // Active role from X-Active-Role header for multi-role users
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