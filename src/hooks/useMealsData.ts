// Legacy hook - use useStandardizedMealsData for new implementations
import { useDataManager } from "./useDataManager";
import type { Meal, Category } from "@/types/meal";

/**
 * @deprecated Use useStandardizedMealsData instead for better error handling, 
 * filtering, and pagination support
 */
export const useMealsData = () => {
  const mealsManager = useDataManager<Meal>("meals", {
    orderBy: { column: "name", ascending: true }
  });

  const categoriesManager = useDataManager<Category>("categories", {
    select: "id, name, color",
    filters: [{ column: "is_active", operator: "eq", value: true }],
    orderBy: { column: "sort_order", ascending: true }
  });

  const toggleMealActive = async (meal: Meal) => {
    return mealsManager.toggle(meal.id, 'is_active');
  };

  const fetchAllData = async () => {
    await Promise.all([
      mealsManager.refetch(),
      categoriesManager.refetch()
    ]);
  };

  return {
    meals: mealsManager.data,
    categories: categoriesManager.data,
    loading: mealsManager.loading || categoriesManager.loading,
    fetchMeals: mealsManager.refetch,
    fetchCategories: categoriesManager.refetch,
    toggleMealActive,
    refetch: fetchAllData
  };
};