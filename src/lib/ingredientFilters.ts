import type { IngredientLineItem, IngredientViewMode } from '@/types/kitchen';
import { convertToBaseUnit, getUnitCategory } from './unitConversion';

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
      return ingredients.filter(ingredient => {
        const conversion = convertToBaseUnit(ingredient.totalQuantity, ingredient.unit);
        const category = getUnitCategory(ingredient.unit);
        
        // For weight/volume, convert to base unit (grams/ml) for comparison
        if (category === 'weight' || category === 'volume') {
          // Convert to grams or ml for threshold comparison
          const baseQuantity = ingredient.totalQuantity * (
            category === 'weight' ? 
              (ingredient.unit.toLowerCase() === 'kg' ? 1000 : ingredient.unit.toLowerCase() === 'lb' ? 453.592 : ingredient.unit.toLowerCase() === 'oz' ? 28.3495 : 1) :
              (ingredient.unit.toLowerCase() === 'l' ? 1000 : ingredient.unit.toLowerCase() === 'fl oz' ? 29.5735 : ingredient.unit.toLowerCase() === 'cup' ? 236.588 : 1)
          );
          return baseQuantity >= 5;
        }
        
        // For count units, use original threshold
        return ingredient.totalQuantity >= 5;
      });
    
    case 'major':
      // Show only bulk ingredients (≥ 25g/ml) that need careful weighing
      return ingredients.filter(ingredient => {
        const category = getUnitCategory(ingredient.unit);
        
        // For weight/volume, convert to base unit (grams/ml) for comparison
        if (category === 'weight' || category === 'volume') {
          // Convert to grams or ml for threshold comparison
          const baseQuantity = ingredient.totalQuantity * (
            category === 'weight' ? 
              (ingredient.unit.toLowerCase() === 'kg' ? 1000 : ingredient.unit.toLowerCase() === 'lb' ? 453.592 : ingredient.unit.toLowerCase() === 'oz' ? 28.3495 : 1) :
              (ingredient.unit.toLowerCase() === 'l' ? 1000 : ingredient.unit.toLowerCase() === 'fl oz' ? 29.5735 : ingredient.unit.toLowerCase() === 'cup' ? 236.588 : 1)
          );
          return baseQuantity >= 25;
        }
        
        // For count units, use original threshold
        return ingredient.totalQuantity >= 25;
      });
    
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