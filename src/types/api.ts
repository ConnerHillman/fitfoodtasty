// Standardized API response types for the entire application
export type { BaseEntity } from './common';

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error: ApiError | null;
  loading: boolean;
}

// Standard CRUD operation responses
export interface CrudResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

// Data fetching configuration
export interface DataManagerConfig {
  select?: string;
  filters?: Array<{ column: string; operator: string; value: any }>;
  orderBy?: { column: string; ascending?: boolean };
  dependencies?: any[];
  enableCache?: boolean;
  cacheKey?: string;
}

// Enhanced hook result interface
export interface DataManagerResult<T extends { id: string }> {
  // Data state
  data: T[];
  loading: boolean;
  error: ApiError | null;
  
  // Metadata
  total: number;
  lastFetched: Date | null;
  
  // Methods
  refetch: () => Promise<T[]>;
  create: (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<CrudResponse<T>>;
  update: (id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>) => Promise<CrudResponse<T>>;
  remove: (id: string) => Promise<CrudResponse<boolean>>;
  toggle: (id: string, field?: string) => Promise<CrudResponse<T>>;
  
  // Optimistic update control
  setOptimisticData: (data: T[]) => void;
  invalidateCache: () => void;
}

// Error codes for consistent error handling
export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  RLS_VIOLATION = 'RLS_VIOLATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Standard error messages
export const ErrorMessages = {
  [ApiErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ApiErrorCode.AUTHENTICATION_ERROR]: 'Authentication required. Please log in.',
  [ApiErrorCode.AUTHORIZATION_ERROR]: 'You do not have permission to perform this action.',
  [ApiErrorCode.VALIDATION_ERROR]: 'Invalid data provided. Please check your input.',
  [ApiErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ApiErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ApiErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ApiErrorCode.CACHE_ERROR]: 'Cache error occurred. Data may be outdated.',
  [ApiErrorCode.RLS_VIOLATION]: 'Access denied. You can only access your own data.',
  [ApiErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred.'
} as const;