import { useMemo } from "react";
import type { Meal, MealFilters } from "@/types/meal";

export const useFilteredMeals = (meals: Meal[], filters: MealFilters) => {
  const filteredMeals = useMemo(() => {
    let filtered = meals;
    
    // Apply status filter
    if (filters.statusFilter === 'active') {
      filtered = filtered.filter(meal => meal.is_active);
    } else if (filters.statusFilter === 'inactive') {
      filtered = filtered.filter(meal => !meal.is_active);
    }
    
    // Apply category filter
    if (filters.categoryFilter !== 'all') {
      filtered = filtered.filter(meal => meal.category === filters.categoryFilter);
    }
    
    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(meal =>
        meal.name.toLowerCase().includes(query) ||
        (meal.description && meal.description.toLowerCase().includes(query)) ||
        (meal.category && meal.category.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [meals, filters]);

  return filteredMeals;
};