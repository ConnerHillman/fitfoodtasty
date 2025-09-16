import type { IngredientLineItem, IngredientViewMode } from '@/types/kitchen';
import { convertToBaseUnit, getUnitCategory } from './unitConversion';

/**
 * Filter ingredients by quantity threshold based on view mode
 */
export const filterIngredientsByViewMode = (
  ingredients: IngredientLineItem[],
  viewMode: IngredientViewMode
): IngredientLineItem[] => {
  // Convert any ingredient to a normalized comparison value in grams/ml (or raw count)
  const toComparable = (item: IngredientLineItem): number => {
    const category = getUnitCategory(item.unit);

    if (category === 'weight') {
      // Item.totalQuantity is a display value in either g or kg. Normalize to grams for comparison
      const unit = item.unit.toLowerCase().trim();
      return unit === 'kg' ? item.totalQuantity * 1000
        : unit === 'lb' ? item.totalQuantity * 453.592
        : unit === 'oz' ? item.totalQuantity * 28.3495
        : item.totalQuantity; // assume grams
    }

    if (category === 'volume') {
      const unit = item.unit.toLowerCase().trim();
      return unit === 'l' ? item.totalQuantity * 1000
        : unit === 'fl oz' ? item.totalQuantity * 29.5735
        : unit === 'cup' ? item.totalQuantity * 236.588
        : unit === 'pint' ? item.totalQuantity * 473.176
        : unit === 'quart' ? item.totalQuantity * 946.353
        : unit === 'gallon' ? item.totalQuantity * 3785.41
        : item.totalQuantity; // assume ml
    }

    // count/other: use as-is
    return item.totalQuantity;
  };

  const threshold = viewMode === 'major' ? 25 : viewMode === 'production' ? 5 : 0;

  if (threshold === 0) return ingredients;

  const filtered = ingredients.filter((ingredient) => {
    const comparable = toComparable(ingredient);
    const keep = comparable >= threshold;

    // Debugging: log suspicious drops where unit is weight/volume but large human value is filtered out
    if (!keep) {
      const cat = getUnitCategory(ingredient.unit);
      if ((cat === 'weight' || cat === 'volume') && ingredient.totalQuantity >= 10) {
        console.warn('[IngredientFilter] Dropped by threshold', {
          name: ingredient.ingredientName,
          displayed: `${ingredient.totalQuantity}${ingredient.unit}`,
          comparable,
          threshold,
          category: cat,
        });
      }
    }

    return keep;
  });

  return filtered;
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