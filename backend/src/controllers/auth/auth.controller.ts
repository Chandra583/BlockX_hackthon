import { Request, Response } from 'express';
import { AuthService } from '../../services/core/auth.service';
import { ApiError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { 
  ILoginRequest, 
  IRegisterRequest, 
  IForgotPasswordRequest, 
  IResetPasswordRequest, 
  IChangePasswordRequest,
  IVerifyEmailRequest,
  IResendVerificationRequest
} from '../../types/auth.types';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: IRegisterRequest = req.body;

      // Validate registration data
      const validationErrors = AuthService.validateRegistrationData(registerData);
      if (validationErrors.length > 0) {
        throw new ValidationError('Registration validation failed', validationErrors);
      }

      // Register user
      const result = await AuthService.register(registerData);

      logger.info(`User registered: ${registerData.email}`);

      res.status(201).json({
        status: 'success',
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Registration failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          details: error.details,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: ILoginRequest = req.body;

      // Basic validation
      if (!loginData.email || !loginData.password) {
        throw new ValidationError('Email and password are required');
      }

      // Login user
      const result = await AuthService.login(loginData);

      logger.info(`User logged in: ${loginData.email}`);

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Login failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Login failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Refresh token
      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: tokens,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Token refresh failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new ValidationError('Authorization header is required');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new ValidationError('Invalid token format');
      }

      // Logout user
      await AuthService.logout(token);

      res.status(200).json({
        status: 'success',
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Logout failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Logout failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/verify-email
   * Verify email address
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token }: IVerifyEmailRequest = req.body;

      if (!token) {
        throw new ValidationError('Verification token is required');
      }

      // Verify email
      const result = await AuthService.verifyEmail(token);

      res.status(200).json({
        status: 'success',
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Email verification failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Email verification failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      res.status(200).json({
        status: 'success',
        message: 'User info retrieved successfully',
        data: req.user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get me failed:', error);

      res.status(500).json({
        status: 'error',
        message: 'Get user info failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Change password (requires authentication)
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const changePasswordData: IChangePasswordRequest = req.body;

      if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
        throw new ValidationError('Current password, new password, and confirm password are required');
      }

      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Change password
      const result = await AuthService.changePassword(req.user.id, changePasswordData);

      res.status(200).json({
        status: 'success',
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Change password failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Change password failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Resend email verification
   */
  static async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email }: IResendVerificationRequest = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      // Resend verification
      const result = await AuthService.resendEmailVerification(email);

      res.status(200).json({
        status: 'success',
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Resend verification failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Resend verification failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const forgotPasswordData: IForgotPasswordRequest = req.body;

      if (!forgotPasswordData.email) {
        throw new ValidationError('Email is required');
      }

      // Request password reset
      const result = await AuthService.forgotPassword(forgotPasswordData);

      res.status(200).json({
        status: 'success',
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Forgot password failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Forgot password failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const resetPasswordData: IResetPasswordRequest = req.body;

      if (!resetPasswordData.token || !resetPasswordData.newPassword || !resetPasswordData.confirmPassword) {
        throw new ValidationError('Token, new password, and confirm password are required');
      }

      // Reset password
      const result = await AuthService.resetPassword(resetPasswordData);

      res.status(200).json({
        status: 'success',
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Reset password failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Reset password failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/auth/profile
   * Get user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Get profile
      const profile = await AuthService.getProfile(req.user.id);

      res.status(200).json({
        status: 'success',
        message: 'Profile retrieved successfully',
        data: profile,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get profile failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Get profile failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/validate-token
   * Validate access token
   */
  static async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ValidationError('Token is required');
      }

      // If we reach here, the token is valid (middleware already validated it)
      res.status(200).json({
        status: 'success',
        message: 'Token is valid',
        data: {
          valid: true,
          user: req.user
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Token validation failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Token validation failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/auth/health
   * Health check endpoint
   */
  static async health(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Auth service is healthy',
        data: {
          service: 'auth',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });
    } catch (error) {
      logger.error('Health check failed:', error);

      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }
} 