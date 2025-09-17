import { useFilteredData } from "./useFilteredData";
import type { Meal, MealFilters } from "@/types/meal";

export const useFilteredMeals = (meals: Meal[], filters: MealFilters) => {
  return useFilteredData(meals, {
    searchTerm: filters.searchQuery,
    searchFields: ['name', 'description', 'category'] as (keyof Meal)[],
    statusField: 'is_active' as keyof Meal,
    statusFilter: filters.statusFilter,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    customFilter: (meal: Meal) => {
      // Apply category filter
      if (filters.categoryFilter !== 'all') {
        return meal.category === filters.categoryFilter;
      }
      return true;
    }
  });
};