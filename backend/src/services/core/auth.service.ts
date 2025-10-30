import { User } from '../../models/core/User.model';
import { JWTService } from './jwt.service';
import { 
  ILoginRequest, 
  IRegisterRequest, 
  IAuthResponse, 
  IUserInfo, 
  ITokenPair,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IChangePasswordRequest
} from '../../types/auth.types';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/errors';
import crypto from 'crypto';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(registerData: IRegisterRequest): Promise<IAuthResponse> {
    try {
      logger.info('Registration attempt started for:', registerData.email);
      
      // Check database connection first
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        logger.error('Database not connected. State:', mongoose.connection.readyState);
        throw new ApiError(500, 'Database connection not available');
      }
      
      const { email, password, confirmPassword, firstName, lastName, role, roleSpecificData } = registerData;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        throw new ApiError(400, 'Missing required fields');
      }

      // Validate password match
      if (password !== confirmPassword) {
        throw new ApiError(400, 'Passwords do not match');
      }

      logger.info('Checking for existing user:', email.toLowerCase());
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new ApiError(409, 'User already exists with this email');
      }

      // Validate role-specific data
      if (!roleSpecificData) {
        throw new ApiError(400, 'Role-specific data is required');
      }

      logger.info('Creating new user with role:', role);

      // Create user with active status for immediate login
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        role,
        roleData: roleSpecificData,
        accountStatus: 'active', // Changed from 'pending' to 'active'
        verificationStatus: 'unverified',
        emailVerified: false // Email verification can happen later
      });

      logger.info('Attempting to save user to database...');
      await user.save();
      logger.info('User saved successfully with ID:', user._id);

      // Generate tokens
      const tokens = JWTService.generateTokenPair(
        user._id.toString(),
        user.email,
        user.role,
        false
      );

      // Generate email verification token
      const emailVerificationToken = JWTService.generateEmailVerificationToken(
        user.email,
        user._id.toString()
      );

      // Log registration
      logger.info(`User registered successfully: ${user.email} (${user.role})`);

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, emailVerificationToken);

      return {
        user: this.formatUserInfo(user),
        tokens,
        message: 'Registration successful. Please verify your email address.'
      };
    } catch (error) {
      logger.error('Registration failed with error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle specific MongoDB errors
      if (error instanceof Error) {
        if (error.message.includes('E11000')) {
          throw new ApiError(409, 'Email already exists');
        }
        if (error.message.includes('validation failed')) {
          throw new ApiError(400, `Validation error: ${error.message}`);
        }
        if (error.message.includes('timeout')) {
          throw new ApiError(500, 'Database timeout - please try again');
        }
        
        logger.error('Detailed error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw new ApiError(500, `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Login user
   */
  static async login(loginData: ILoginRequest): Promise<IAuthResponse> {
    try {
      const { email, password, rememberMe = false } = loginData;

      // Find user and include password field
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new ApiError(423, 'Account is temporarily locked due to multiple failed login attempts');
      }

      // Check if account is active
      if (user.accountStatus !== 'active') {
        throw new ApiError(401, 'Account is not active. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        throw new ApiError(401, 'Invalid email or password');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = JWTService.generateTokenPair(
        user._id.toString(),
        user.email,
        user.role,
        rememberMe
      );

      // Log successful login
      logger.info(`User logged in successfully: ${user.email} (${user.role})`);

      return {
        user: this.formatUserInfo(user),
        tokens,
        message: 'Login successful'
      };
    } catch (error) {
      logger.error('Login failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Login failed. Please try again.');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<ITokenPair> {
    try {
      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      // Check if account is still active
      if (user.accountStatus !== 'active') {
        throw new ApiError(401, 'Account is not active');
      }

      // Generate new token pair
      const tokens = JWTService.generateTokenPair(
        user._id.toString(),
        user.email,
        user.role,
        false
      );

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  static async logout(accessToken: string): Promise<void> {
    try {
      // Create blacklist entry
      const blacklistEntry = JWTService.createTokenBlacklistEntry(accessToken);
      
      // TODO: Store blacklist entry in database or cache
      // await TokenBlacklist.create(blacklistEntry);
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw new ApiError(500, 'Logout failed');
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      // Verify token
      const decoded = JWTService.verifyEmailVerificationToken(token);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if email matches
      if (user.email !== decoded.email) {
        throw new ApiError(400, 'Invalid verification token');
      }

      // Update user
      user.emailVerified = true;
      user.verificationStatus = 'verified';
      
      // If account was pending, activate it
      if (user.accountStatus === 'pending') {
        user.accountStatus = 'active';
      }
      
      await user.save();

      logger.info(`Email verified for user: ${user.email}`);

      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(400, 'Invalid or expired verification token');
    }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(forgotPasswordData: IForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const { email } = forgotPasswordData;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists or not
        return { message: 'If an account with this email exists, you will receive a password reset link.' };
      }

      // Generate reset token
      const resetToken = JWTService.generatePasswordResetToken(user.email, user._id.toString());

      // TODO: Send reset email
      // await EmailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Password reset requested for user: ${user.email}`);

      return { message: 'If an account with this email exists, you will receive a password reset link.' };
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw new ApiError(500, 'Password reset request failed');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(resetPasswordData: IResetPasswordRequest): Promise<{ message: string }> {
    try {
      const { token, newPassword, confirmPassword } = resetPasswordData;

      // Validate password match
      if (newPassword !== confirmPassword) {
        throw new ApiError(400, 'Passwords do not match');
      }

      // Verify token
      const decoded = JWTService.verifyPasswordResetToken(token);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if email matches
      if (user.email !== decoded.email) {
        throw new ApiError(400, 'Invalid reset token');
      }

      // Update password
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      
      // Reset login attempts
      await user.resetLoginAttempts();
      
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Password reset failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(400, 'Invalid or expired reset token');
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, changePasswordData: IChangePasswordRequest): Promise<{ message: string }> {
    try {
      const { currentPassword, newPassword, confirmPassword } = changePasswordData;

      // Validate password match
      if (newPassword !== confirmPassword) {
        throw new ApiError(400, 'New passwords do not match');
      }

      // Find user
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new ApiError(401, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Password change failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Password change failed');
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<IUserInfo> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return this.formatUserInfo(user);
    } catch (error) {
      logger.error('Get profile failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Failed to fetch user profile');
    }
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(email: string): Promise<{ message: string }> {
    try {
      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return { message: 'If an account with this email exists, you will receive a verification email.' };
      }

      // Check if already verified
      if (user.emailVerified) {
        throw new ApiError(400, 'Email is already verified');
      }

      // Generate new verification token
      const verificationToken = JWTService.generateEmailVerificationToken(
        user.email,
        user._id.toString()
      );

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, verificationToken);

      logger.info(`Email verification resent for user: ${user.email}`);

      return { message: 'If an account with this email exists, you will receive a verification email.' };
    } catch (error) {
      logger.error('Resend email verification failed:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Failed to resend verification email');
    }
  }

  /**
   * Format user info for response
   */
  private static formatUserInfo(user: any): IUserInfo {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      roles: Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean),
      accountStatus: user.accountStatus,
      verificationStatus: user.verificationStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }

  /**
   * Validate registration data
   */
  static validateRegistrationData(data: IRegisterRequest): string[] {
    const errors: string[] = [];

    // Email validation
    if (!data.email || !data.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(data.password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(data.password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(data.password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(data.password)) {
      errors.push('Password must contain at least one special character');
    }

    // Name validation
    if (!data.firstName || !data.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!data.lastName || !data.lastName.trim()) {
      errors.push('Last name is required');
    }

    // Role validation
    if (!data.role) {
      errors.push('Role is required');
    } else if (!['admin', 'owner', 'buyer', 'service', 'insurance', 'government'].includes(data.role)) {
      errors.push('Invalid role');
    }

    // Terms validation
    if (!data.termsAccepted) {
      errors.push('Terms and conditions must be accepted');
    }

    if (!data.privacyAccepted) {
      errors.push('Privacy policy must be accepted');
    }

    return errors;
  }
} 