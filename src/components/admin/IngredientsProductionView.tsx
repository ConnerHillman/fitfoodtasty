import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Hash,
  ArrowDownAZ,
  Package,
  Clock
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { ProductionSummary, IngredientLineItem, SortBy } from '@/types/kitchen';

interface IngredientsProductionViewProps {
  productionData: ProductionSummary | null;
  sortedIngredientLineItems: IngredientLineItem[];
  loading: boolean;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  ingredientsError?: string | null;
  onRetryIngredients?: () => void;
}

export const IngredientsProductionView: React.FC<IngredientsProductionViewProps> = ({
  productionData,
  sortedIngredientLineItems,
  loading,
  sortBy,
  setSortBy,
  ingredientsError,
  onRetryIngredients
}) => {

  // Use the processed ingredient data from parent
  const ingredientsData = useMemo(() => {
    if (!productionData || !sortedIngredientLineItems.length) return null;

    return {
      productionDate: productionData.productionDate,
      totalIngredients: productionData.totalIngredients || 0,
      uniqueIngredientTypes: productionData.uniqueIngredientTypes || 0,
      ingredientLineItems: sortedIngredientLineItems
    };
  }, [productionData, sortedIngredientLineItems]);

  if (!ingredientsData && !ingredientsError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ingredient data</h3>
            <p className="mt-1 text-sm text-gray-500">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load ingredients</h3>
            <p className="mt-1 text-sm text-gray-500 mb-4">
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
            {formatDate(ingredientsData.productionDate, 'EEEE do MMMM')} Ingredient Requirements
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
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
                  <tr key={`${ingredient.ingredientName}-${index}`} className="border-b border-border/50 hover:bg-muted/30 print:hover:bg-transparent print:break-inside-avoid">
                    <td className="py-3 px-3 text-center align-top">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold print:bg-transparent print:text-black print:rounded-none">
                          {ingredient.totalQuantity}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 print:text-black">
                          {ingredient.unit}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm font-medium text-foreground align-top">
                      {ingredient.ingredientName}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground align-top print:hidden">
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
                    No ingredients required for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Separator className="my-4" />
        
        <div className="kitchen-total flex items-center justify-between bg-muted/30 p-3 rounded border print:text-center print:text-white print:bg-black print:border-black">
          <span className="text-lg font-bold">
            TOTAL INGREDIENT TYPES:
          </span>
          <span className="text-2xl font-bold text-primary print:text-white">
            {ingredientsData.ingredientLineItems.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};