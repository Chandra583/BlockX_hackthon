import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IJWTPayload, ITokenPair } from '../../types/auth.types';
import { UserRole } from '../../types/user.types';
import { logger } from '../../utils/logger';

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REMEMBER_ME_EXPIRY = '30d';

  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<IJWTPayload, 'iat' | 'exp'>): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.sign(payload, secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'veridrive',
      audience: 'veridrive-users'
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string, rememberMe: boolean = false): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    const payload = {
      userId,
      type: 'refresh',
      tokenId: crypto.randomUUID()
    };

    const expiry = rememberMe ? this.REMEMBER_ME_EXPIRY : this.REFRESH_TOKEN_EXPIRY;

    return jwt.sign(payload, secret, {
      expiresIn: expiry,
      issuer: 'veridrive',
      audience: 'veridrive-refresh'
    });
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(
    userId: string,
    email: string,
    role: UserRole,
    rememberMe: boolean = false
  ): ITokenPair {
    const accessToken = this.generateAccessToken({
      userId,
      email,
      role
    });

    const refreshToken = this.generateRefreshToken(userId, rememberMe);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryInSeconds(this.ACCESS_TOKEN_EXPIRY),
      tokenType: 'Bearer'
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): IJWTPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'veridrive',
        audience: 'veridrive-users'
      }) as IJWTPayload;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): any {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'veridrive',
        audience: 'veridrive-refresh'
      });
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Token decode failed:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiry time
   */
  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeUntilExpiry(token: string): number {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return 0;
    
    return Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(email: string, userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      email,
      userId,
      type: 'email_verification',
      tokenId: crypto.randomUUID()
    };

    return jwt.sign(payload, secret, {
      expiresIn: '24h',
      issuer: 'veridrive',
      audience: 'veridrive-verification'
    });
  }

  /**
   * Verify email verification token
   */
  static verifyEmailVerificationToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'veridrive',
        audience: 'veridrive-verification'
      });
    } catch (error) {
      logger.error('Email verification token verification failed:', error);
      throw new Error('Invalid email verification token');
    }
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(email: string, userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      email,
      userId,
      type: 'password_reset',
      tokenId: crypto.randomUUID()
    };

    return jwt.sign(payload, secret, {
      expiresIn: '1h',
      issuer: 'veridrive',
      audience: 'veridrive-reset'
    });
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'veridrive',
        audience: 'veridrive-reset'
      });
    } catch (error) {
      logger.error('Password reset token verification failed:', error);
      throw new Error('Invalid password reset token');
    }
  }

  /**
   * Convert time string to seconds
   */
  private static getExpiryInSeconds(timeString: string): number {
    const timeMap: { [key: string]: number } = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid time format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    return value * timeMap[unit];
  }

  /**
   * Create token blacklist entry (for logout)
   */
  static createTokenBlacklistEntry(token: string): {
    tokenId: string;
    expiresAt: Date;
  } {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token for blacklisting');
    }

    return {
      tokenId: decoded.jti || crypto.createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(decoded.exp * 1000)
    };
  }

  /**
   * Generate API key token (for service integrations)
   */
  static generateApiKeyToken(userId: string, keyId: string, permissions: string[]): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      userId,
      keyId,
      permissions,
      type: 'api_key'
    };

    return jwt.sign(payload, secret, {
      expiresIn: '1y',
      issuer: 'veridrive',
      audience: 'veridrive-api'
    });
  }

  /**
   * Verify API key token
   */
  static verifyApiKeyToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'veridrive',
        audience: 'veridrive-api'
      });
    } catch (error) {
      logger.error('API key token verification failed:', error);
      throw new Error('Invalid API key token');
    }
  }
} 