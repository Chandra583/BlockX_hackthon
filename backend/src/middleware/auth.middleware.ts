import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/core/jwt.service';
import { User } from '../models/core/User.model';
import { ApiError, AuthenticationError, AuthorizationError } from '../utils/errors';
import { UserRole } from '../types/user.types';
import { logger } from '../utils/logger';

/**
 * Authentication middleware - validates JWT tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Access token is required');
    }

    // Extract token from Bearer header
    const token = JWTService.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new AuthenticationError('Invalid token format');
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      throw new AuthenticationError('Account is not active');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < passwordChangedTimestamp) {
        throw new AuthenticationError('Password was changed. Please login again.');
      }
    }

    // TODO: Check if token is blacklisted (for logout functionality)
    // const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
    // if (isBlacklisted) {
    //   throw new AuthenticationError('Token has been revoked');
    // }

    // Attach user and token info to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      accountStatus: user.accountStatus,
      verificationStatus: user.verificationStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    req.sessionId = decoded.userId; // For session tracking
    
    // Update last activity
    user.lastActivity = new Date();
    await user.save();

    logger.info(`Authenticated user: ${user.email} (${user.role})`);
    
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // No token provided, continue without authentication
    }

    // Use the authenticate middleware logic
    await authenticate(req, res, next);
  } catch (error) {
    // If authentication fails, continue without authentication
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  // @ts-ignore: Express middleware pattern
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      logger.info(`Authorized user: ${req.user.email} for roles: ${allowedRoles.join(', ')}`);
      
      next();
    } catch (error) {
      logger.error('Authorization failed:', error);
      
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = authorize('admin');

/**
 * Owner-only authorization middleware
 */
export const requireOwner = authorize('owner');

/**
 * Buyer-only authorization middleware
 */
export const requireBuyer = authorize('buyer');

/**
 * Service provider authorization middleware
 */
export const requireService = authorize('service');

/**
 * Insurance provider authorization middleware
 */
export const requireInsurance = authorize('insurance');

/**
 * Government agency authorization middleware
 */
export const requireGovernment = authorize('government');

/**
 * Multi-role authorization middleware combinations
 */
export const requireAdminOrOwner = authorize('admin', 'owner');
export const requireBusinessRoles = authorize('service', 'insurance', 'government');
// @ts-ignore: Express middleware pattern
export const requireVerifiedUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!req.user.emailVerified) {
      throw new AuthorizationError('Email verification required');
    }

    if (req.user.verificationStatus !== 'verified') {
      throw new AuthorizationError('Account verification required');
    }

    next();
  } catch (error) {
    logger.error('Verification check failed:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(403).json({
      status: 'error',
      message: 'Verification required',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Self-access authorization (user can only access their own resources)
 */
export const requireSelfAccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const targetUserId = req.params.userId || req.params.id;
    
    if (!targetUserId) {
      throw new ApiError(400, 'User ID parameter is required');
    }

    // Admin can access any user's resources
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (req.user.id !== targetUserId) {
      throw new AuthorizationError('Access denied. You can only access your own resources.');
    }

    next();
  } catch (error) {
    logger.error('Self-access check failed:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(403).json({
      status: 'error',
      message: 'Access denied',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: string) => {
  // @ts-ignore: Express middleware pattern
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!req.permissions || !req.permissions.includes(permission)) {
        throw new AuthorizationError(`Permission required: ${permission}`);
      }

      logger.info(`Authorized user: ${req.user.email} for permission: ${permission}`);
      
      next();
    } catch (error) {
      logger.error('Permission check failed:', error);
      
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(403).json({
        status: 'error',
        message: 'Permission denied',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * API Key authentication middleware (for service integrations)
 */
// @ts-ignore: Express middleware pattern
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    // Verify API key token
    const decoded = JWTService.verifyApiKeyToken(apiKey);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('Invalid API key');
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      throw new AuthenticationError('Account is not active');
    }

    // Set user and permissions
    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      accountStatus: user.accountStatus,
      verificationStatus: user.verificationStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    req.permissions = decoded.permissions;
    
    logger.info(`API Key authenticated for user: ${user.email}`);
    
    next();
  } catch (error) {
    logger.error('API Key authentication failed:', error);
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'API Key authentication failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Rate limiting middleware (basic implementation)
 */
export const rateLimit = (requests: number, windowMs: number) => {
  const clients = new Map<string, { count: number; resetTime: number }>();
  
  // @ts-ignore: Express middleware pattern
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of clients.entries()) {
      if (now > value.resetTime) {
        clients.delete(key);
      }
    }
    
    // Get or create client record
    let client = clients.get(clientId);
    if (!client) {
      client = { count: 0, resetTime: now + windowMs };
      clients.set(clientId, client);
    }
    
    // Reset if window expired
    if (now > client.resetTime) {
      client.count = 0;
      client.resetTime = now + windowMs;
    }
    
    // Increment count
    client.count++;
    
    // Check if rate limit exceeded
    if (client.count > requests) {
      const retryAfter = Math.ceil((client.resetTime - now) / 1000);
      
      res.set({
        'X-RateLimit-Limit': requests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(client.resetTime).toISOString(),
        'Retry-After': retryAfter.toString()
      });
      
      return res.status(429).json({
        status: 'error',
        message: 'Rate limit exceeded',
        retryAfter,
        timestamp: new Date().toISOString()
      });
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': requests.toString(),
      'X-RateLimit-Remaining': (requests - client.count).toString(),
      'X-RateLimit-Reset': new Date(client.resetTime).toISOString()
    });
    
    req.rateLimit = {
      limit: requests,
      remaining: requests - client.count,
      reset: new Date(client.resetTime),
      retryAfter: client.count > requests ? Math.ceil((client.resetTime - now) / 1000) : undefined
    };
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is present, but doesn't require it
 */
export const optionalAuth = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }
    
    const token = JWTService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      // Invalid token format, continue without authentication
      return next();
    }
    
    try {
      const decoded = JWTService.verifyAccessToken(token);
      
      // Find user and attach to request
      const user = await User.findById(decoded.userId);
      if (user && user.accountStatus === 'active' && !user.isLocked) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };
      }
    } catch (tokenError) {
      // Invalid token, but continue without authentication
      logger.warn('Invalid token in optional auth:', tokenError.message);
    }
    
    next();
  } catch (error) {
    // Error in middleware, but continue without authentication
    logger.error('Error in optional auth middleware:', error);
    next();
  }
}; 