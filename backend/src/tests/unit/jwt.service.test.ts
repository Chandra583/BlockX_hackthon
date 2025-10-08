import { JWTService } from '../../services/core/jwt.service';
import { setupTestDatabase, teardownTestDatabase, clearDatabase } from '../setup';

describe('JWT Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Token Generation', () => {
    const testPayload = {
      userId: '60f1b2b3c4e5f6a7b8c9d0e1',
      role: 'buyer' as const,
      email: 'test@veridrive.com'
    };

    test('should generate valid access token', () => {
      const token = JWTService.generateAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should generate valid refresh token', () => {
      const token = JWTService.generateRefreshToken(testPayload.userId, false);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should generate email verification token', () => {
      const token = JWTService.generateEmailVerificationToken(testPayload.email, testPayload.userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should generate password reset token', () => {
      const token = JWTService.generatePasswordResetToken(testPayload.email, testPayload.userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should generate API key token', () => {
      const token = JWTService.generateApiKeyToken(testPayload.userId, 'test-key-id', ['read', 'write']);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('Token Verification', () => {
    const testPayload = {
      userId: '60f1b2b3c4e5f6a7b8c9d0e1',
      role: 'buyer' as const,
      email: 'test@veridrive.com'
    };

    test('should verify valid access token', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const decoded = JWTService.verifyAccessToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.email).toBe(testPayload.email);
    });

    test('should verify valid refresh token', () => {
      const token = JWTService.generateRefreshToken(testPayload.userId, false);
      const decoded = JWTService.verifyRefreshToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.type).toBe('refresh');
    });

    test('should verify email verification token', () => {
      const token = JWTService.generateEmailVerificationToken(testPayload.email, testPayload.userId);
      const decoded = JWTService.verifyEmailVerificationToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    test('should verify password reset token', () => {
      const token = JWTService.generatePasswordResetToken(testPayload.email, testPayload.userId);
      const decoded = JWTService.verifyPasswordResetToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => {
        JWTService.verifyAccessToken(invalidToken);
      }).toThrow();
    });

    test('should throw error for malformed token', () => {
      const malformedToken = 'notajwttoken';
      
      expect(() => {
        JWTService.verifyAccessToken(malformedToken);
      }).toThrow();
    });

    test('should check if token is expired', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const isExpired = JWTService.isTokenExpired(token);
      
      expect(isExpired).toBe(false);
    });
  });

  describe('Token Extraction', () => {
    test('should extract token from Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const bearerHeader = `Bearer ${token}`;
      
      const extracted = JWTService.extractTokenFromHeader(bearerHeader);
      expect(extracted).toBe(token);
    });

    test('should return null for invalid header format', () => {
      const invalidHeader = 'InvalidFormat eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      
      const extracted = JWTService.extractTokenFromHeader(invalidHeader);
      expect(extracted).toBeNull();
    });

    test('should return null for missing token', () => {
      const headerWithoutToken = 'Bearer ';
      
      const extracted = JWTService.extractTokenFromHeader(headerWithoutToken);
      expect(extracted).toBeNull();
    });

    test('should return null for undefined header', () => {
      const extracted = JWTService.extractTokenFromHeader(undefined as any);
      expect(extracted).toBeNull();
    });
  });

  describe('Token Utilities', () => {
    const testPayload = {
      userId: '60f1b2b3c4e5f6a7b8c9d0e1',
      role: 'buyer' as const,
      email: 'test@veridrive.com'
    };

    test('should check if token is expired', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const isExpired = JWTService.isTokenExpired(token);
      
      expect(isExpired).toBe(false);
    });

    test('should get token expiry date', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const expiry = JWTService.getTokenExpiry(token);
      
      expect(expiry).toBeDefined();
      expect(expiry).toBeInstanceOf(Date);
    });

    test('should get time until expiry', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const timeUntilExpiry = JWTService.getTimeUntilExpiry(token);
      
      expect(timeUntilExpiry).toBeGreaterThan(0);
    });

    test('should decode token without verification', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const decoded = JWTService.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.payload).toBeDefined();
      expect(decoded.payload.userId).toBe(testPayload.userId);
    });

    test('should create token blacklist entry', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const blacklistEntry = JWTService.createTokenBlacklistEntry(token);
      
      expect(blacklistEntry).toBeDefined();
      expect(blacklistEntry.tokenId).toBeDefined();
      expect(blacklistEntry.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Token Payload Extraction', () => {
    const testPayload = {
      userId: '60f1b2b3c4e5f6a7b8c9d0e1',
      role: 'buyer' as const,
      email: 'test@veridrive.com'
    };

    test('should extract payload from valid token', () => {
      const token = JWTService.generateAccessToken(testPayload);
      const decoded = JWTService.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('should have correct token types', () => {
      const accessToken = JWTService.generateAccessToken(testPayload);
      const refreshToken = JWTService.generateRefreshToken(testPayload.userId, false);
      
      const accessDecoded = JWTService.verifyAccessToken(accessToken);
      const refreshDecoded = JWTService.verifyRefreshToken(refreshToken);
      
      expect(accessDecoded.role).toBe('buyer');
      expect(refreshDecoded.type).toBe('refresh');
    });

    test('should have different expiry times', () => {
      const accessToken = JWTService.generateAccessToken(testPayload);
      const refreshToken = JWTService.generateRefreshToken(testPayload.userId, false);
      
      const accessDecoded = JWTService.verifyAccessToken(accessToken);
      const refreshDecoded = JWTService.verifyRefreshToken(refreshToken);
      
      // Refresh token should expire after access token
      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing JWT secret', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        JWTService.generateAccessToken({
          userId: '60f1b2b3c4e5f6a7b8c9d0e1',
          role: 'buyer',
          email: 'test@veridrive.com'
        });
      }).toThrow();
      
      // Restore secret
      process.env.JWT_SECRET = originalSecret;
    });

    test('should handle invalid token format gracefully', () => {
      const invalidTokens = [
        '',
        'not.a.jwt',
        'Bearer invalidtoken',
        null,
        undefined
      ];
      
      invalidTokens.forEach(token => {
        expect(() => {
          JWTService.verifyAccessToken(token as any);
        }).toThrow();
      });
    });
  });
}); 