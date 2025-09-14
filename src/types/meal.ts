// Shared types for meal management

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  total_weight?: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  sort_order: number;
}

export interface MealFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  image_url: string;
  shelf_life_days: number;
}

export interface MealFilters {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  categoryFilter: string;
  viewMode: 'grid' | 'list';
}