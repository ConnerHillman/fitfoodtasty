import type { IngredientLineItem, IngredientViewMode } from '@/types/kitchen';

/**
 * Filter ingredients by quantity threshold based on view mode
 */
export const filterIngredientsByViewMode = (
  ingredients: IngredientLineItem[],
  viewMode: IngredientViewMode
): IngredientLineItem[] => {
  switch (viewMode) {
    case 'production':
      // Hide small quantities (< 5g/ml) that don't need precise weighing
      return ingredients.filter(ingredient => ingredient.totalQuantity >= 5);
    
    case 'major':
      // Show only bulk ingredients (≥ 25g/ml) that need careful weighing
      return ingredients.filter(ingredient => ingredient.totalQuantity >= 25);
    
    case 'complete':
    default:
      // Show all ingredients for verification/allergen checking
      return ingredients;
  }
};

/**
 * Get view mode display info for UI
 */
export const getViewModeInfo = (viewMode: IngredientViewMode) => {
  switch (viewMode) {
    case 'production':
      return {
        label: 'Production Only',
        description: '≥5g/ml - Items that need weighing',
        threshold: 5
      };
    case 'major':
      return {
        label: 'Major Items',
        description: '≥25g/ml - Bulk ingredients only',
        threshold: 25
      };
    case 'complete':
      return {
        label: 'Complete List',
        description: 'All ingredients for verification',
        threshold: 0
      };
  }
};

/**
 * Get filter status text for display
 */
export const getFilterStatusText = (
  filteredCount: number,
  totalCount: number,
  viewMode: IngredientViewMode
): string => {
  if (viewMode === 'complete' || filteredCount === totalCount) {
    return `${totalCount} ingredients`;
  }
  
  const { label } = getViewModeInfo(viewMode);
  return `Showing ${filteredCount} of ${totalCount} ingredients (${label})`;
};