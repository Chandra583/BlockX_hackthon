// Core Types
export * from './user.types';
export * from './auth.types';
// Phase 2 types temporarily disabled for deployment
// export * from './vehicle.types';
// export * from './document.types';

// Common Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: string[];
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Database ID Types
export type ObjectId = string;
export type MongooseObjectId = import('mongoose').Types.ObjectId; 