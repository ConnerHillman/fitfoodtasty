// Shared types for meal management
import type { BaseEntity, BaseFilters, EntityStatus } from './common';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Meal extends BaseEntity {
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
  image_url?: string;
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

export interface MealFilters extends BaseFilters {
  searchTerm: string;
  statusFilter: EntityStatus;
  categoryFilter: string;
  viewMode: 'grid' | 'list';
}