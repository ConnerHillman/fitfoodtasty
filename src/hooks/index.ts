// Centralized exports for all hooks

// Core data management hooks
export { useEnhancedDataManager } from './useEnhancedDataManager';
export { useDataManager } from './useDataManager';
export { useSupabaseData, useSupabaseCrud } from './useSupabaseData';

// Standardized domain-specific hooks
export { useStandardizedMealsData } from './useStandardizedMealsData';
export { useStandardizedCustomersData } from './useStandardizedCustomersData';

// Legacy domain hooks (marked for migration)
export { useMealsData } from './useMealsData';
export { useCustomersData } from './useCustomersData';
export { useFulfillmentData } from './useFulfillmentData';
export { useProductionData } from './useProductionData';

// Utility hooks
export { useFilteredData } from './useFilteredData';
export { usePaginatedData } from './usePaginatedData';
export { useErrorHandler } from './useErrorHandler';
export { useDebounce } from './useDebounce';
export { useDebouncedValue } from './useDebouncedValue';
export { useOptimizedSearch } from './useOptimizedSearch';

// UI and interaction hooks
export { useUserRole } from './useUserRole';
export { useViewTracking } from './useViewTracking';
export { useAbandonedCart } from './useAbandonedCart';
export { useDeliveryLogic } from './useDeliveryLogic';
export { useDiscounts } from './useDiscounts';
export { useDateValidation } from './useDateValidation';

// Cache and performance hooks
export { useCustomerCache } from './useCustomerCache';

// Specialized hooks
export { useFilteredCustomers } from './useFilteredCustomers';
export { useFilteredMeals } from './useFilteredMeals';

// Re-export common types
export type {
  DataManagerConfig,
  DataManagerResult,
  ApiResponse,
  ApiError,
  CrudResponse,
  PaginatedResponse
} from '../types/api';

export type {
  BaseEntity,
  BaseFilters,
  ViewModeFilters,
  DateRange,
  EntityStatus,
  OrderStatus,
  DataFiltersConfig
} from '../types/common';