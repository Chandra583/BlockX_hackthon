// Environment Configuration
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'VERIDRIVE',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  JWT_EXPIRY: import.meta.env.VITE_JWT_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: import.meta.env.VITE_JWT_REFRESH_EXPIRY || '7d',
  
  // Development settings
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',
  
  // Backend URLs
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  
  // Security
  ENABLE_HTTPS: import.meta.env.VITE_ENABLE_HTTPS === 'true',
  
  // Feature flags
  ENABLE_REGISTRATION: import.meta.env.VITE_ENABLE_REGISTRATION !== 'false',
  ENABLE_FORGOT_PASSWORD: import.meta.env.VITE_ENABLE_FORGOT_PASSWORD !== 'false',
  ENABLE_EMAIL_VERIFICATION: import.meta.env.VITE_ENABLE_EMAIL_VERIFICATION !== 'false',
  ENABLE_2FA: import.meta.env.VITE_ENABLE_2FA !== 'false',
  
  // Analytics & Monitoring
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID || '',
  
  // Error Reporting
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  ERROR_REPORTING_DSN: import.meta.env.VITE_ERROR_REPORTING_DSN || '',
  
  // Computed values
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    ME: '/auth/me',
    VALIDATE_TOKEN: '/auth/validate-token',
    HEALTH: '/auth/health',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    UPLOAD_AVATAR: '/user/upload-avatar',
    PREFERENCES: '/user/preferences',
    NOTIFICATIONS: '/user/notifications',
    ACTIVITY: '/user/activity',
    DASHBOARD: '/user/dashboard',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USERS_SEARCH: '/admin/users/search',
    USER_ACTIONS: '/admin/users/:id/actions',
    FRAUD_CASES: '/admin/fraud-cases',
    SYSTEM_LOGS: '/admin/system-logs',
  },
  OWNER: {
    VEHICLES: '/owner/vehicles',
    VEHICLE_DETAILS: '/owner/vehicles/:id',
    ODOMETER: '/owner/vehicles/:id/odometer',
    CONSENT: '/owner/consent',
    DEVICES: '/owner/devices',
  },
  BUYER: {
    MARKETPLACE: '/buyer/marketplace',
    FAVORITES: '/buyer/favorites',
    PURCHASES: '/buyer/purchases',
    WATCHLIST: '/buyer/watchlist',
    SEARCH: '/buyer/search',
  },
  SERVICE: {
    SERVICES: '/service/services',
    CERTIFICATIONS: '/service/certifications',
    CUSTOMERS: '/service/customers',
    CALENDAR: '/service/calendar',
  },
  INSURANCE: {
    POLICIES: '/insurance/policies',
    CLAIMS: '/insurance/claims',
    RISK_ASSESSMENT: '/insurance/risk-assessment',
    ANALYTICS: '/insurance/analytics',
  },
  GOVERNMENT: {
    COMPLIANCE: '/government/compliance',
    REGISTRATIONS: '/government/registrations',
    VIOLATIONS: '/government/violations',
    REPORTS: '/government/reports',
  },
  COMMON: {
    HEALTH: '/health',
    INFO: '/info',
  },
} as const;

// App Constants
export const APP_CONSTANTS = {
  ROLES: {
    ADMIN: 'admin',
    OWNER: 'owner',
    BUYER: 'buyer',
    SERVICE: 'service',
    INSURANCE: 'insurance',
    GOVERNMENT: 'government',
  },
  NOTIFICATION_TYPES: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
  },
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  SESSION: {
    MAX_IDLE_TIME: 30 * 60 * 1000, // 30 minutes
    WARNING_TIME: 5 * 60 * 1000,   // 5 minutes
    CHECK_INTERVAL: 60 * 1000,     // 1 minute
  },
  LOCAL_STORAGE_KEYS: {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    SESSION_DATA: 'session_data',
    LAST_ACTIVITY: 'last_activity',
  },
} as const;

// Validation helpers
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.API_BASE_URL) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  if (!config.APP_NAME) {
    errors.push('VITE_APP_NAME is required');
  }
  
  if (config.ENABLE_ANALYTICS && !config.ANALYTICS_ID) {
    errors.push('VITE_ANALYTICS_ID is required when analytics is enabled');
  }
  
  if (config.ENABLE_ERROR_REPORTING && !config.ERROR_REPORTING_DSN) {
    errors.push('VITE_ERROR_REPORTING_DSN is required when error reporting is enabled');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    throw new Error('Invalid configuration: ' + errors.join(', '));
  }
};

// Initialize config validation in development
if (config.IS_DEVELOPMENT) {
  try {
    validateConfig();
    console.log('✅ Environment configuration validated successfully');
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error);
  }
} 