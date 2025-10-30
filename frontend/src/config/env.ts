// Environment Configuration
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://veridrive-x-hackthon.vercel.app/api',
  API_URL: import.meta.env.VITE_API_URL || 'https://veridrive-x-hackthon.vercel.app/api',
  VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV || 'production',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  // Additional environment variables
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS || 'false',
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  // Backend URL for websockets or direct links
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://veridrive-x-hackthon.vercel.app',
};

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
  
  if (!ENV.API_BASE_URL) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  if (!ENV.VITE_APP_VERSION) {
    errors.push('VITE_APP_VERSION is required');
  }
  
  if (ENV.VITE_ENABLE_ANALYTICS === 'true' && !ENV.VITE_SENTRY_DSN) {
    errors.push('VITE_SENTRY_DSN is required when analytics is enabled');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    throw new Error('Invalid configuration: ' + errors.join(', '));
  }
};

// Initialize config validation in development
if (ENV.VITE_NODE_ENV === 'development') {
  try {
    validateConfig();
    console.log('✅ Environment configuration validated successfully');
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error);
  }
} 