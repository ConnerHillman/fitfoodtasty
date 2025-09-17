import { useEnhancedDataManager } from "./useEnhancedDataManager";
import { useFilteredData } from "./useFilteredData";
import { usePaginatedData } from "./usePaginatedData";
import type { Meal, Category } from "@/types/meal";
import type { BaseFilters, EntityStatus } from "@/types/common";

interface MealFilters extends BaseFilters {
  statusFilter: EntityStatus;
  categoryFilter: string;
  viewMode: 'grid' | 'list';
}

export const useStandardizedMealsData = (filters: MealFilters) => {
  // Use enhanced data manager for meals
  const mealsManager = useEnhancedDataManager<Meal>("meals", {
    orderBy: { column: "sort_order", ascending: true },
    dependencies: [filters.statusFilter, filters.categoryFilter]
  });

  // Use enhanced data manager for categories
  const categoriesManager = useEnhancedDataManager<Category>("categories", {
    select: "id, name, color, sort_order",
    filters: [{ column: "is_active", operator: "eq", value: true }],
    orderBy: { column: "sort_order", ascending: true }
  });

  // Apply filtering to meals
  const filteredMeals = useFilteredData(mealsManager.data, {
    searchTerm: filters.searchTerm,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    searchFields: ['name', 'description', 'category'] as (keyof Meal)[],
    statusField: 'is_active' as keyof Meal,
    statusFilter: filters.statusFilter,
    customFilter: filters.categoryFilter !== 'all' 
      ? (meal: Meal) => meal.category === filters.categoryFilter
      : undefined
  });

  // Apply pagination
  const paginatedMeals = usePaginatedData(filteredMeals, 20);

  // Enhanced operations
  const toggleMealActive = async (meal: Meal) => {
    return mealsManager.toggle(meal.id, 'is_active');
  };

  const refreshAllData = async () => {
    await Promise.all([
      mealsManager.refetch(),
      categoriesManager.refetch()
    ]);
  };

  return {
    // Data
    meals: paginatedMeals.paginatedResult.data,
    allMeals: filteredMeals,
    categories: categoriesManager.data,
    
    // Loading states
    loading: mealsManager.loading || categoriesManager.loading,
    error: mealsManager.error || categoriesManager.error,
    
    // Pagination
    pagination: paginatedMeals.paginatedResult.pagination,
    totalPages: paginatedMeals.paginatedResult.totalPages,
    hasNextPage: paginatedMeals.paginatedResult.hasNextPage,
    hasPreviousPage: paginatedMeals.paginatedResult.hasPreviousPage,
    goToPage: paginatedMeals.goToPage,
    nextPage: paginatedMeals.nextPage,
    previousPage: paginatedMeals.previousPage,
    
    // CRUD operations
    createMeal: mealsManager.create,
    updateMeal: mealsManager.update,
    deleteMeal: mealsManager.remove,
    toggleMealActive,
    
    // Utility methods
    refetch: refreshAllData,
    invalidateCache: () => {
      mealsManager.invalidateCache();
      categoriesManager.invalidateCache();
    }
  };
};