import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

let mongoServer: MongoMemoryServer;

// Test Database Setup
export const setupTestDatabase = async (): Promise<void> => {
  try {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(uri);
    
    logger.info('🧪 Test database connected successfully');
  } catch (error) {
    logger.error('❌ Test database connection failed:', error);
    throw error;
  }
};

// Test Database Cleanup
export const teardownTestDatabase = async (): Promise<void> => {
  try {
    // Close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    // Stop in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    logger.info('🧹 Test database cleaned up successfully');
  } catch (error) {
    logger.error('❌ Test database cleanup failed:', error);
    throw error;
  }
};

// Clear all collections
export const clearDatabase = async (): Promise<void> => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    logger.info('🗑️ All collections cleared');
  } catch (error) {
    logger.error('❌ Database clear failed:', error);
    throw error;
  }
};

// Test user data factory
export const createTestUser = (role: string = 'buyer', overrides: any = {}) => {
  const baseUser = {
    email: `test-${role}@veridrive.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    role,
    emailVerified: true,
    accountStatus: 'active',
    ...overrides
  };

  // Add role-specific data
  switch (role) {
    case 'admin':
      baseUser.roleData = {
        adminLevel: 'junior',
        permissions: ['user_management'],
        departments: ['support'],
        accessLevel: 1,
        investigationsConducted: 0,
        fraudCasesResolved: 0,
        ...overrides.roleData
      };
      break;
    case 'owner':
      baseUser.roleData = {
        trackingConsent: true,
        verificationLevel: 'basic',
        vehiclesOwned: [],
        devicesRegistered: [],
        totalMileageRecorded: 0,
        fraudAlertsReceived: 0,
        ...overrides.roleData
      };
      break;
    case 'buyer':
      baseUser.roleData = {
        buyerType: 'individual',
        purchaseHistory: [],
        savedSearches: [],
        watchlist: [],
        financingPreapproved: false,
        ...overrides.roleData
      };
      break;
    case 'service':
      baseUser.roleData = {
        businessName: 'Test Service',
        businessType: 'mechanic',
        licenseNumber: 'TEST123',
        licenseExpiry: new Date('2025-12-31'),
        serviceCategories: ['maintenance'],
        certificationsHeld: [],
        serviceRadius: 50,
        servicesCompleted: 0,
        averageRating: 0,
        isAuthorizedDealer: false,
        ...overrides.roleData
      };
      break;
    case 'insurance':
      baseUser.roleData = {
        companyName: 'Test Insurance',
        licenseNumber: 'INS123',
        licenseExpiry: new Date('2025-12-31'),
        coverageTypes: ['auto'],
        riskModels: ['standard'],
        policiesIssued: 0,
        claimsProcessed: 0,
        fraudCasesReported: 0,
        apiIntegrationLevel: 'basic',
        ...overrides.roleData
      };
      break;
    case 'government':
      baseUser.roleData = {
        agencyName: 'Test Agency',
        agencyType: 'local',
        jurisdiction: 'Test City',
        departmentCode: 'TEST',
        clearanceLevel: 'public',
        accessScope: ['basic'],
        reportingRequirements: [],
        complianceMonitoring: true,
        ...overrides.roleData
      };
      break;
  }

  return baseUser;
};

// Test notification factory
export const createTestNotification = (userId: string, overrides: any = {}) => {
  return {
    userId,
    userRole: 'buyer',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'system',
    priority: 'medium',
    channels: ['in_app'],
    status: {
      in_app: 'sent'
    },
    ...overrides
  };
};

// JWT Test Helpers
export const createTestTokens = async (userId: string, email: string = 'test@veridrive.com', role: 'buyer' | 'admin' | 'owner' | 'service' | 'insurance' | 'government' = 'buyer') => {
  const { JWTService } = await import('../services/core/jwt.service');
  
  return {
    accessToken: JWTService.generateAccessToken({ userId, email, role }),
    refreshToken: JWTService.generateRefreshToken(userId, false)
  };
};

// API Test Helpers
export const getAuthHeaders = (token: string) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Error Test Helpers
export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.status).toBe('error');
  if (field) {
    expect(response.body.message).toContain(field);
  }
};

export const expectAuthError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.status).toBe('error');
  expect(response.body.message).toContain('authentication');
};

export const expectForbiddenError = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body.status).toBe('error');
};

// Performance Test Helpers
export const measureExecutionTime = async (fn: Function): Promise<{ result: any; time: number }> => {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
};

// Rate Limiting Test Helpers
export const simulateRateLimit = async (
  request: Function,
  limit: number,
  windowMs: number = 15 * 60 * 1000
): Promise<boolean> => {
  const requests = [];
  
  for (let i = 0; i < limit + 1; i++) {
    requests.push(request());
  }
  
  const responses = await Promise.all(requests);
  const lastResponse = responses[responses.length - 1];
  
  return lastResponse.status === 429;
};

// Test Environment Variables
export const setTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.BCRYPT_SALT_ROUNDS = '4'; // Faster for tests
  process.env.ACCOUNT_LOCKOUT_ATTEMPTS = '3';
  process.env.ACCOUNT_LOCKOUT_DURATION = '300000'; // 5 minutes
};

// Global test timeout
jest.setTimeout(30000);

// Setup environment for tests
setTestEnvironment(); 