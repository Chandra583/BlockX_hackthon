/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    statusCode: number,
    message: string,
    errorCode?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    // Maintain proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error class
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error class
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error class
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error class
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflict Error class
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists') {
    super(409, message, 'CONFLICT_ERROR');
  }
}

/**
 * Rate Limit Error class
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Server Error class
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'SERVER_ERROR');
  }
}

/**
 * Database Error class
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed') {
    super(500, message, 'DATABASE_ERROR');
  }
}

/**
 * External Service Error class
 */
export class ExternalServiceError extends ApiError {
  constructor(message: string = 'External service error', statusCode: number = 502) {
    super(statusCode, message, 'EXTERNAL_SERVICE_ERROR');
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  status: 'error';
  message: string;
  errorCode?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
  error: ApiError | Error,
  path?: string
): ErrorResponse {
  const response: ErrorResponse = {
    status: 'error',
    message: error.message,
    timestamp: new Date().toISOString(),
    path
  };

  if (error instanceof ApiError) {
    response.errorCode = error.errorCode;
    response.details = error.details;
  }

  return response;
}

/**
 * Check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is temporarily locked',
  EMAIL_NOT_VERIFIED: 'Email address is not verified',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  ROLE_NOT_AUTHORIZED: 'Role not authorized for this action',
  
  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  PASSWORD_TOO_WEAK: 'Password does not meet security requirements',
  EMAIL_ALREADY_EXISTS: 'Email address is already registered',
  
  // Resources
  USER_NOT_FOUND: 'User not found',
  RESOURCE_NOT_FOUND: 'Resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  
  // Server
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  
  // Database
  DATABASE_CONNECTION_ERROR: 'Database connection failed',
  DATABASE_OPERATION_ERROR: 'Database operation failed',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'External service error',
  PAYMENT_SERVICE_ERROR: 'Payment service error',
  EMAIL_SERVICE_ERROR: 'Email service error'
};

/**
 * HTTP Status Code constants
 */
export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// Aliases for backward compatibility
export const BadRequestError = class extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'BAD_REQUEST_ERROR', details);
  }
};

export const UnauthorizedError = class extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED_ERROR');
  }
};

export const AppError = ApiError; 