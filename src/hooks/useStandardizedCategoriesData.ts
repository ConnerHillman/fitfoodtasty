import { useState, useMemo, useCallback, useEffect } from 'react';
import { useEnhancedDataManager } from './useEnhancedDataManager';
import type { DataManagerConfig } from '@/types/api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface CategoriesFilters {
  searchTerm: string;
  showInactive: boolean;
}

export const useStandardizedCategoriesData = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<CategoriesFilters>({
    searchTerm: '',
    showInactive: false
  });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);

  const config: DataManagerConfig = {
    orderBy: { column: 'sort_order', ascending: true }
  };

  const {
    data: categories,
    loading,
    error,
    create,
    update,
    remove,
    toggle,
    refetch
  } = useEnhancedDataManager<Category>('categories', config);

  // Fetch meals
  const fetchMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name, description, category, is_active')
        .order('name');

      if (error) throw error;
      setMeals(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch meals',
        variant: 'destructive'
      });
    } finally {
      setMealsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filter by active status
    if (!filters.showInactive) {
      filtered = filtered.filter(cat => cat.is_active);
    }

    // Filter by search term
    if (filters.searchTerm.trim()) {
      const query = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [categories, filters]);

  // Stats
  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
    totalMeals: meals.length
  }), [categories, meals]);

  // Meal operations
  const assignMealToCategory = useCallback(async (mealId: string, categoryName: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .update({ category: categoryName })
        .eq('id', mealId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Meal category updated successfully'
      });

      await fetchMeals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast, fetchMeals]);

  const getMealsInCategory = useCallback((categoryName: string) => {
    return meals.filter(meal => meal.category === categoryName);
  }, [meals]);

  const getUnassignedMeals = useCallback(() => {
    const categoryNames = categories.map(c => c.name);
    return meals.filter(meal => !categoryNames.includes(meal.category) || !meal.category);
  }, [meals, categories]);

  // Category operations with validation
  const deleteCategory = useCallback(async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    // Check if any meals use this category
    const mealsInCategory = meals.filter(m => m.category === category.name);
    if (mealsInCategory.length > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This category is used by ${mealsInCategory.length} meal(s). Please reassign or delete those meals first.`,
        variant: 'destructive'
      });
      return;
    }

    await remove(id);
  }, [categories, meals, remove, toast]);

  const moveCategory = useCallback(async (category: Category, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id);

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedCategories.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetCategory = sortedCategories[targetIndex];

    // Swap sort orders
    await Promise.all([
      update(category.id, { sort_order: targetCategory.sort_order }),
      update(targetCategory.id, { sort_order: category.sort_order })
    ]);
  }, [categories, update]);

  const createCategory = useCallback(async (data: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    const maxSortOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0;
    return create({
      ...data,
      sort_order: maxSortOrder + 1
    } as any);
  }, [categories, create]);

  return {
    // Data
    categories: filteredCategories,
    allCategories: categories,
    meals,
    loading: loading || mealsLoading,
    error,
    stats,

    // Filters
    filters,
    setFilters,

    // Category operations
    createCategory,
    updateCategory: update,
    deleteCategory,
    toggleCategory: toggle,
    moveCategory,
    refetch,

    // Meal operations
    assignMealToCategory,
    getMealsInCategory,
    getUnassignedMeals,
    refetchMeals: fetchMeals
  };
};
