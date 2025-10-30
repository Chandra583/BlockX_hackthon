import { UserRole } from './user.types';
import { Request } from 'express';

// JWT Token Types
export interface IJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// Authentication Request Types
export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  roleSpecificData?: any;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IVerifyEmailRequest {
  token: string;
}

export interface IResendVerificationRequest {
  email: string;
}

// Authentication Response Types
export interface IAuthResponse {
  user: IUserInfo;
  tokens: ITokenPair;
  message: string;
}

export interface IUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  roles?: UserRole[];
  accountStatus: string;
  verificationStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  profileImage?: string;
  lastLogin?: Date;
  createdAt: Date;
}

// Two-Factor Authentication Types
export interface ITwoFactorSetupRequest {
  password: string;
}

export interface ITwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface ITwoFactorVerifyRequest {
  token: string;
  backupCode?: string;
}

export interface ITwoFactorDisableRequest {
  password: string;
  twoFactorCode: string;
}

// Session Types
export interface ISession {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export interface IActiveSession {
  sessionId: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActivity: Date;
  isCurrent: boolean;
}

// Security Types
export interface ISecurityLog {
  userId: string;
  action: SecurityAction;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  details?: any;
  timestamp: Date;
}

export type SecurityAction = 
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'email_verification'
  | 'two_factor_setup'
  | 'two_factor_disable'
  | 'account_locked'
  | 'account_unlocked'
  | 'profile_update'
  | 'role_change';

// Account Lockout Types
export interface IAccountLockout {
  userId: string;
  reason: LockoutReason;
  lockedAt: Date;
  lockedUntil: Date;
  attempts: number;
  ipAddress: string;
  autoUnlock: boolean;
}

export type LockoutReason = 
  | 'failed_login_attempts'
  | 'suspicious_activity'
  | 'admin_action'
  | 'security_violation'
  | 'manual_lock';

// Permission Types
export interface IPermission {
  resource: string;
  action: string;
  conditions?: any;
}

export interface IRolePermissions {
  role: UserRole;
  permissions: IPermission[];
  inheritFrom?: UserRole[];
}

// Rate Limiting Types
export interface IRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// API Key Types (for service integrations)
export interface IApiKey {
  keyId: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
}

// OAuth Types (for future integrations)
export interface IOAuthProvider {
  provider: 'google' | 'facebook' | 'github';
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface IOAuthRequest {
  provider: 'google' | 'facebook' | 'github';
  code: string;
  state?: string;
}

// Audit Trail Types
export interface IAuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

// Device Registration Types
export interface IDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
  platform: string;
  browser?: string;
  trusted: boolean;
  lastSeen: Date;
  registeredAt: Date;
}

export interface IRegisterDeviceRequest {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
  platform: string;
  browser?: string;
}

// Email Verification Types
export interface IEmailVerificationToken {
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

// Password Reset Types
export interface IPasswordResetToken {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// Authentication Middleware Types
export interface IAuthenticatedRequest extends Request {
  user: IUserInfo;
  sessionId: string;
  permissions: string[];
}

// Alias for backward compatibility
export type AuthenticatedRequest = IAuthenticatedRequest;

export interface IAuthContext {
  user: IUserInfo;
  sessionId: string;
  permissions: string[];
  rateLimit: IRateLimitInfo;
} 