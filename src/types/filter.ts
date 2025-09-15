export interface Filter {
  id: string;
  name: string;
  type: 'dietary' | 'nutrition' | 'calorie' | 'sorting';
  category: string | null;
  threshold: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilterFormData {
  name: string;
  type: 'dietary' | 'nutrition' | 'calorie' | 'sorting';
  category: string | null;
  threshold: Record<string, any> | null;
  is_active: boolean;
}

export interface MealIngredientAllergen {
  id: string;
  meal_id: string;
  ingredient: string;
  is_allergen: boolean;
  allergen_type: string | null;
  created_at: string;
}

export interface FilterFilters {
  searchQuery: string;
  typeFilter: string;
  categoryFilter: string;
  statusFilter: 'all' | 'active' | 'inactive';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}