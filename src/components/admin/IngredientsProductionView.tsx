import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChefHat, 
  Hash,
  ArrowDownAZ,
  Package
} from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface MealBreakdown {
  mealName: string;
  quantity: number;
  unit: string;
  orderCount: number;
}

interface IngredientLineItem {
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  mealBreakdown: MealBreakdown[];
}

interface IngredientsProductionSummary {
  productionDate: Date;
  totalIngredients: number;
  uniqueIngredientTypes: number;
  ingredientLineItems: IngredientLineItem[];
}

interface IngredientsProductionViewProps {
  productionData: any; // Will receive the same data as meals view
  loading: boolean;
  sortBy: 'alphabetical' | 'quantity';
  setSortBy: (sortBy: 'alphabetical' | 'quantity') => void;
}

export const IngredientsProductionView: React.FC<IngredientsProductionViewProps> = ({
  productionData,
  loading,
  sortBy,
  setSortBy
}) => {
  // Process ingredients from the production data
  const ingredientsData = useMemo((): IngredientsProductionSummary | null => {
    if (!productionData?.mealLineItems) return null;

    // We'll need to fetch ingredient data for each meal
    // For now, return a placeholder structure
    const ingredientLineItems: IngredientLineItem[] = [
      {
        ingredientName: "Chicken Breast",
        totalQuantity: 2500,
        unit: "g",
        mealBreakdown: [
          { mealName: "Grilled Chicken Salad", quantity: 1500, unit: "g", orderCount: 10 },
          { mealName: "Chicken Curry", quantity: 1000, unit: "g", orderCount: 5 }
        ]
      },
      {
        ingredientName: "Brown Rice",
        totalQuantity: 800,
        unit: "g", 
        mealBreakdown: [
          { mealName: "Chicken Curry", quantity: 500, unit: "g", orderCount: 5 },
          { mealName: "Veggie Bowl", quantity: 300, unit: "g", orderCount: 3 }
        ]
      },
      {
        ingredientName: "Mixed Vegetables",
        totalQuantity: 1200,
        unit: "g",
        mealBreakdown: [
          { mealName: "Veggie Bowl", quantity: 600, unit: "g", orderCount: 3 },
          { mealName: "Grilled Chicken Salad", quantity: 400, unit: "g", orderCount: 10 },
          { mealName: "Chicken Curry", quantity: 200, unit: "g", orderCount: 5 }
        ]
      }
    ];

    return {
      productionDate: productionData.productionDate,
      totalIngredients: ingredientLineItems.reduce((sum, item) => sum + item.totalQuantity, 0),
      uniqueIngredientTypes: ingredientLineItems.length,
      ingredientLineItems
    };
  }, [productionData]);

  // Memoized sorting logic
  const sortedIngredientLineItems = useMemo(() => {
    if (!ingredientsData?.ingredientLineItems) return [];
    
    const items = [...ingredientsData.ingredientLineItems];
    if (sortBy === 'quantity') {
      return items.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }
    return items.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  }, [ingredientsData?.ingredientLineItems, sortBy]);

  if (!ingredientsData) {
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

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="pb-4 print:hidden">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            {formatDate(ingredientsData.productionDate, 'EEEE do MMMM')} Ingredient Requirements
          </CardTitle>
          
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
              {sortedIngredientLineItems.length > 0 ? (
                sortedIngredientLineItems.map((ingredient, index) => (
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
          <span className="text-lg font-bold">TOTAL INGREDIENT TYPES:</span>
          <span className="text-2xl font-bold text-primary print:text-white">
            {ingredientsData.uniqueIngredientTypes}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};