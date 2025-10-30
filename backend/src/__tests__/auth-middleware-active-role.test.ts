import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { JWTService } from '../services/core/jwt.service';
import { User } from '../models/core/User.model';
import { AuthorizationError } from '../utils/errors';

// Mock dependencies
jest.mock('../services/core/jwt.service');
jest.mock('../models/core/User.model');
jest.mock('../utils/logger');

describe('Auth Middleware - X-Active-Role Validation', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set activeRole from X-Active-Role header when user has that role', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'buyer',
      roles: ['buyer', 'owner'], // Multi-role user
      accountStatus: 'active',
      isLocked: false,
      verificationStatus: 'verified',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      lastActivity: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    mockRequest.headers!['x-active-role'] = 'owner';

    (JWTService.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
    (JWTService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user123', iat: 1234567890 });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.activeRole).toBe('owner');
    expect(mockRequest.user?.roles).toEqual(['buyer', 'owner']);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject when X-Active-Role is not in users roles array', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'buyer',
      roles: ['buyer'], // Only buyer role
      accountStatus: 'active',
      isLocked: false,
      verificationStatus: 'verified',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      lastActivity: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    mockRequest.headers!['x-active-role'] = 'admin'; // Trying to use admin role

    (JWTService.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
    (JWTService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user123', iat: 1234567890 });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(expect.any(Number));
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Active role "admin" is not permitted')
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should default to first role when no X-Active-Role header is provided', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'buyer',
      roles: ['buyer', 'owner'],
      accountStatus: 'active',
      isLocked: false,
      verificationStatus: 'verified',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      lastActivity: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    (JWTService.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
    (JWTService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user123', iat: 1234567890 });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.activeRole).toBe('buyer'); // Should default to first role
    expect(mockNext).toHaveBeenCalled();
  });

  it('should normalize single role to roles array for backward compatibility', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'owner',
      // No roles array (legacy user)
      accountStatus: 'active',
      isLocked: false,
      verificationStatus: 'verified',
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: false,
      lastActivity: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    (JWTService.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
    (JWTService.verifyAccessToken as jest.Mock).mockReturnValue({ userId: 'user123', iat: 1234567890 });
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user?.roles).toEqual(['owner']); // Should normalize to array
    expect(mockRequest.activeRole).toBe('owner');
    expect(mockNext).toHaveBeenCalled();
  });
});

