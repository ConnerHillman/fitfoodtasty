import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Hash,
  ArrowDownAZ,
  Package,
  Clock,
  Filter
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { ProductionSummary, IngredientLineItem, SortBy } from '@/types/kitchen';
import { IngredientFilterModal } from './IngredientFilterModal';

interface IngredientsProductionViewProps {
  productionData: ProductionSummary | null;
  sortedIngredientLineItems: IngredientLineItem[];
  loading: boolean;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  selectedIngredients: Set<string>;
  setSelectedIngredients: (selected: Set<string>) => void;
  ingredientsError?: string | null;
  onRetryIngredients?: () => void;
}

export const IngredientsProductionView: React.FC<IngredientsProductionViewProps> = ({
  productionData,
  sortedIngredientLineItems,
  loading,
  sortBy,
  setSortBy,
  selectedIngredients,
  setSelectedIngredients,
  ingredientsError,
  onRetryIngredients
 }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Initialize selectedIngredients with saved preferences or all ingredients when data first loads
  useEffect(() => {
    if (sortedIngredientLineItems.length > 0 && selectedIngredients.size === 0) {
      const allIngredientNames = new Set(sortedIngredientLineItems.map(item => item.ingredientName));
      
      // Try to load saved filter preferences
      try {
        const saved = localStorage.getItem('kitchen-ingredient-filter-preferences');
        if (saved) {
          const savedPreferences = new Set(JSON.parse(saved) as string[]);
          // Only use saved preferences if they match available ingredients
          const validSavedIngredients = new Set(
            Array.from(savedPreferences).filter(name => allIngredientNames.has(name))
          );
          if (validSavedIngredients.size > 0) {
            setSelectedIngredients(validSavedIngredients);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load ingredient filter preferences:', error);
      }
      
      // Fallback to selecting all ingredients
      setSelectedIngredients(allIngredientNames);
    }
  }, [sortedIngredientLineItems.length, selectedIngredients.size, setSelectedIngredients]);

  // Filter ingredients based on selected ingredients
  const filteredIngredientLineItems = useMemo(() => {
    if (selectedIngredients.size === 0) {
      return sortedIngredientLineItems; // Show all if none selected (initialization case)
    }
    return sortedIngredientLineItems.filter(ingredient => 
      selectedIngredients.has(ingredient.ingredientName)
    );
  }, [sortedIngredientLineItems, selectedIngredients]);

  // Use the processed ingredient data from parent
  const ingredientsData = useMemo(() => {
    if (!productionData || !sortedIngredientLineItems.length) return null;

    return {
      collectionDate: productionData.collectionDate,
      totalIngredients: productionData.totalIngredients || 0,
      uniqueIngredientTypes: productionData.uniqueIngredientTypes || 0,
      ingredientLineItems: filteredIngredientLineItems,
      allIngredientLineItems: sortedIngredientLineItems
    };
  }, [productionData, sortedIngredientLineItems, filteredIngredientLineItems]);

  // Calculate filter status
  const hiddenIngredientsCount = sortedIngredientLineItems.length - filteredIngredientLineItems.length;

  if (!ingredientsData && !ingredientsError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No ingredient data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a date with scheduled meals to view ingredient requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state with retry option
  if (ingredientsError && onRetryIngredients) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-2 text-sm font-medium text-foreground">Failed to load ingredients</h3>
            <p className="mt-1 text-sm text-muted-foreground mb-4">
              {ingredientsError}
            </p>
            <Button onClick={onRetryIngredients} disabled={loading}>
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="pb-4 print:hidden">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            {formatDate(ingredientsData.collectionDate, 'EEEE do MMMM')} Ingredient Requirements
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            {/* Filter Controls */}
            <div className="flex gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterModal(true)}
                disabled={loading}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filter Ingredients
                {hiddenIngredientsCount > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({hiddenIngredientsCount} hidden)
                  </span>
                )}
              </Button>
            </div>
            
            {/* Sorting Controls */}
            <div className="flex gap-2 print:hidden">
              <Button
                variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('alphabetical')}
                disabled={loading}
                className="text-xs"
              >
                <ArrowDownAZ className="h-3 w-3 mr-1" />
                A-Z
              </Button>
              <Button
                variant={sortBy === 'quantity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('quantity')}
                disabled={loading}
                className="text-xs"
              >
                <Hash className="h-3 w-3 mr-1" />
                Qty
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 print:p-0">
        {/* Ingredients Table */}
        <div className="kitchen-table-container overflow-x-auto" role="region" aria-label="Kitchen ingredient requirements">
          <table className="w-full border-collapse min-w-full kitchen-ingredient-list">
            <thead className="print:break-before-avoid">
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 px-3 text-sm font-bold text-muted-foreground w-24">Qty</th>
                <th className="text-left py-2 px-3 text-sm font-bold text-muted-foreground">Ingredient</th>
                <th className="text-left py-2 px-3 text-sm font-bold text-muted-foreground print:hidden">Used In</th>
              </tr>
            </thead>
            <tbody>
              {ingredientsData.ingredientLineItems.length > 0 ? (
                ingredientsData.ingredientLineItems.map((ingredient, index) => (
                   <tr key={`${ingredient.ingredientName}-${index}`} className="border-b border-border/50 hover:bg-muted/30 print:hover:bg-transparent print:break-inside-avoid kitchen-ingredient-row">
                    <td className="py-3 px-3 text-center align-top print:py-1 kitchen-ingredient-quantity">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold print:bg-transparent print:text-black print:rounded-none">
                          {ingredient.totalQuantity}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 print:text-black">
                          {ingredient.unit}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm font-medium text-foreground align-top print:py-1 kitchen-ingredient-name">
                      {ingredient.ingredientName}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground align-top print:hidden print:py-1">
                      <div className="space-y-1">
                        {ingredient.mealBreakdown.map((meal, mealIndex) => (
                          <div key={mealIndex} className="flex justify-between items-center">
                            <span className="truncate mr-2">{meal.mealName}</span>
                            <span className="flex-shrink-0 text-xs bg-muted px-2 py-1 rounded">
                              {meal.quantity}{meal.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    {selectedIngredients.size === 0 
                      ? "No ingredients selected - use the filter to select ingredients"
                      : "No ingredients match the current filter selection"
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Filter Status */}
        {hiddenIngredientsCount > 0 && (
          <div className="text-sm text-muted-foreground print:hidden mt-4">
            Showing {filteredIngredientLineItems.length} of {sortedIngredientLineItems.length} ingredients 
            ({hiddenIngredientsCount} hidden by filter)
          </div>
        )}
        
        <Separator className="my-4" />
        
        <div className="kitchen-total flex items-center justify-between bg-muted/30 p-3 rounded border print:text-center print:text-white print:bg-black print:border-black">
          <span className="text-lg font-bold">
            TOTAL INGREDIENT TYPES:
          </span>
          <span className="text-2xl font-bold text-primary print:text-white">
            {filteredIngredientLineItems.length === 0 ? "0" : ingredientsData.ingredientLineItems.length}
          </span>
        </div>

        {/* Filter Modal */}
        <IngredientFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          ingredients={sortedIngredientLineItems}
          selectedIngredients={selectedIngredients}
          onApply={setSelectedIngredients}
        />
      </CardContent>
    </Card>
  );
};