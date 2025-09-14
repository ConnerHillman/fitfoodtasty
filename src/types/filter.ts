export interface Filter {
  id: string;
  name: string;
  type: 'dietary' | 'nutrition' | 'calorie' | 'sorting';
  threshold: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilterFormData {
  name: string;
  type: 'dietary' | 'nutrition' | 'calorie' | 'sorting';
  threshold: Record<string, any> | null;
  is_active: boolean;
}

export interface FilterFilters {
  searchQuery: string;
  typeFilter: string;
  statusFilter: 'all' | 'active' | 'inactive';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}