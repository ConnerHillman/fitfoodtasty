import { useMemo } from 'react';
import { useEnhancedDataManager } from './useEnhancedDataManager';
import { useFilteredData } from './useFilteredData';
import { usePaginatedData } from './usePaginatedData';

interface Allergen {
  id: string;
  name: string;
  description?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  saturated_fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  salt_per_100g: number;
  default_unit: string;
  allergens?: Allergen[];
}

interface IngredientFilters {
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterBy?: 'all' | 'high-protein' | 'low-calorie' | 'with-allergens';
}

export const useStandardizedIngredientsData = (filters: IngredientFilters = {}) => {
  const {
    data: ingredients,
    loading,
    error,
    total,
    lastFetched,
    create,
    update,
    remove,
    refetch,
    invalidateCache
  } = useEnhancedDataManager<Ingredient>('ingredients', {
    orderBy: { column: 'name', ascending: true },
    select: `
      *,
      ingredient_allergens(
        allergen_id,
        allergens(
          id,
          name,
          description
        )
      )
    `
  });

  // Transform data to include allergens
  const enrichedIngredients = useMemo(() => {
    return ingredients.map(ingredient => ({
      ...ingredient,
      saturated_fat_per_100g: ingredient.saturated_fat_per_100g || 0,
      salt_per_100g: ingredient.salt_per_100g || 0,
      allergens: (ingredient as any).ingredient_allergens?.map((ia: any) => ia.allergens) || []
    }));
  }, [ingredients]);

  // Apply filters
  const filteredIngredients = useFilteredData(enrichedIngredients, {
    searchTerm: filters.searchTerm || '',
    sortBy: filters.sortBy || 'name',
    sortOrder: filters.sortOrder || 'asc',
    searchFields: ['name', 'description'],
    customFilter: (ingredient) => {
      const filterBy = filters.filterBy || 'all';
      if (filterBy === 'high-protein') return ingredient.protein_per_100g > 15;
      if (filterBy === 'low-calorie') return ingredient.calories_per_100g < 100;
      if (filterBy === 'with-allergens') return ingredient.allergens && ingredient.allergens.length > 0;
      return true;
    }
  });

  // Setup pagination
  const {
    paginatedResult,
    goToPage,
    setPageSize
  } = usePaginatedData(filteredIngredients, 50);

  const paginatedIngredients = paginatedResult.data;
  const currentPage = paginatedResult.pagination.page;
  const totalPages = paginatedResult.totalPages;

  // Stats
  const stats = useMemo(() => ({
    total: enrichedIngredients.length,
    highProtein: enrichedIngredients.filter(ing => ing.protein_per_100g > 15).length,
    lowCalorie: enrichedIngredients.filter(ing => ing.calories_per_100g < 100).length,
    withAllergens: enrichedIngredients.filter(ing => ing.allergens && ing.allergens.length > 0).length,
    avgCalories: Math.round(
      enrichedIngredients.reduce((sum, ing) => sum + ing.calories_per_100g, 0) / enrichedIngredients.length || 0
    ),
    filtered: filteredIngredients.length
  }), [enrichedIngredients, filteredIngredients]);

  return {
    // Data
    allIngredients: enrichedIngredients,
    filteredIngredients,
    paginatedIngredients,
    
    // State
    loading,
    error,
    total,
    lastFetched,
    stats,
    
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    setPageSize,
    
    // CRUD operations
    createIngredient: create,
    updateIngredient: update,
    deleteIngredient: remove,
    
    // Cache management
    refetch,
    invalidateCache
  };
};
