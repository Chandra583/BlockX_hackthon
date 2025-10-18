import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment configuration interface
 */
interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;
  
  // Database
  MONGODB_URI: string;
  MONGODB_TEST_URI: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Security
  BCRYPT_SALT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  ACCOUNT_LOCKOUT_ATTEMPTS: number;
  ACCOUNT_LOCKOUT_DURATION: number;
  
  // Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  
  // Frontend
  FRONTEND_URL: string;
  CORS_ORIGIN: string;
  
  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
  ALLOWED_FILE_TYPES: string;
  
  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET_NAME: string;
  AWS_S3_BUCKET_URL: string;
  
  // Image Processing
  IMAGE_QUALITY: number;
  IMAGE_MAX_WIDTH: number;
  IMAGE_MAX_HEIGHT: number;
  THUMBNAIL_WIDTH: number;
  THUMBNAIL_HEIGHT: number;
  
  // Vehicle Management
  VIN_VALIDATION_ENABLED: boolean;
  VEHICLE_DOCUMENTS_PATH: string;
  MAX_VEHICLE_IMAGES: number;
  
  // Logging
  LOG_LEVEL: string;
  LOG_FORMAT: string;
  LOG_FILE_PATH: string;
  
  // Development
  DEBUG: string;
  ENABLE_SWAGGER: boolean;
  SWAGGER_HOST: string;
  
  // Testing
  TEST_TIMEOUT: number;
  TEST_JWT_SECRET: string;
  
  // Admin
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  SUPER_ADMIN_TOKEN: string;

  // Blockchain toggles
  ARWEAVE_ENABLED: boolean;
  SOLANA_ANCHOR_SIGNER: 'service' | 'owner' | 'platform';
}

/**
 * Validate required environment variables
 */
const validateEnvironment = (): void => {
  const requiredVars = [
    'NODE_ENV',
    // NOTE: Do not require PORT in serverless environments like Vercel
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

/**
 * Get environment configuration
 */
const getEnvironmentConfig = (): EnvironmentConfig => {
  validateEnvironment();
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    APP_NAME: process.env.APP_NAME || 'VERIDRIVE',
    APP_VERSION: process.env.APP_VERSION || '1.0.0',
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/veridrive',
    MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/veridrive_test',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Security
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    ACCOUNT_LOCKOUT_ATTEMPTS: parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS || '5', 10),
    ACCOUNT_LOCKOUT_DURATION: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000', 10),
    
    // Email
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@veridrive.com',
    
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    
    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf',
    
    // AWS S3 Configuration
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'veridrive-uploads',
    AWS_S3_BUCKET_URL: process.env.AWS_S3_BUCKET_URL || 'https://veridrive-uploads.s3.amazonaws.com',
    
    // Image Processing
    IMAGE_QUALITY: parseInt(process.env.IMAGE_QUALITY || '85', 10),
    IMAGE_MAX_WIDTH: parseInt(process.env.IMAGE_MAX_WIDTH || '1920', 10),
    IMAGE_MAX_HEIGHT: parseInt(process.env.IMAGE_MAX_HEIGHT || '1080', 10),
    THUMBNAIL_WIDTH: parseInt(process.env.THUMBNAIL_WIDTH || '300', 10),
    THUMBNAIL_HEIGHT: parseInt(process.env.THUMBNAIL_HEIGHT || '200', 10),
    
    // Vehicle Management
    VIN_VALIDATION_ENABLED: process.env.VIN_VALIDATION_ENABLED !== 'false',
    VEHICLE_DOCUMENTS_PATH: process.env.VEHICLE_DOCUMENTS_PATH || 'uploads/vehicles/',
    MAX_VEHICLE_IMAGES: parseInt(process.env.MAX_VEHICLE_IMAGES || '10', 10),
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',
    
    // Development
    DEBUG: process.env.DEBUG || 'veridrive:*',
    ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true',
    SWAGGER_HOST: process.env.SWAGGER_HOST || 'localhost:3000',
    
    // Testing
    TEST_TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
    TEST_JWT_SECRET: process.env.TEST_JWT_SECRET || 'test-secret',
    
    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@veridrive.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
    SUPER_ADMIN_TOKEN: process.env.SUPER_ADMIN_TOKEN || 'super-admin-token',

    // Blockchain toggles
    ARWEAVE_ENABLED: process.env.ARWEAVE_ENABLED === 'true',
    SOLANA_ANCHOR_SIGNER: (process.env.SOLANA_ANCHOR_SIGNER as any) || 'service',
  };
};

// Export configuration
export const config = getEnvironmentConfig();
export type { EnvironmentConfig }; 