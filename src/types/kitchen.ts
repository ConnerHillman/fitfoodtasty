// Shared types for Kitchen Production Dashboard

export interface MealLineItem {
  mealName: string;
  totalQuantity: number;
  orders: Array<{
    orderId: string;
    quantity: number;
    customerName?: string;
  }>;
}

export interface MealBreakdown {
  mealName: string;
  quantity: number;
  unit: string;
  orderCount: number;
}

export interface IngredientLineItem {
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  mealBreakdown: MealBreakdown[];
}

export interface ProductionSummary {
  productionDate: Date;
  totalMeals: number;
  uniqueMealTypes: number;
  mealLineItems: MealLineItem[];
  ingredientLineItems: IngredientLineItem[];
  totalIngredients: number;
  uniqueIngredientTypes: number;
}

export type SortBy = 'alphabetical' | 'quantity';
