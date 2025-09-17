// Common types used across multiple components

export interface DateRange {
  from: Date;
  to: Date;
}

export interface BaseFilters {
  searchTerm: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface ViewModeFilters {
  viewMode: "list" | "card" | "grid";
}

// Common props interfaces
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface RefreshableProps {
  onRefresh?: () => void;
}

export interface LoadingProps {
  loading?: boolean;
}

// Status types
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type EntityStatus = 'active' | 'inactive' | 'all';

// Common entity structure
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

// Generic data filtering interface
export interface DataFiltersConfig<T> {
  searchFields?: (keyof T)[];
  statusField?: keyof T;
  customFilters?: Array<{
    field: keyof T;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
    value: any;
  }>;
}