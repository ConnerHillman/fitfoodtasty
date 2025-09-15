import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, endOfDay } from 'date-fns';
import type { MealLineItem, IngredientLineItem, ProductionSummary } from '@/types/kitchen';
import { aggregateQuantities, canAggregateUnits, formatQuantity, convertToBaseUnit } from '@/lib/unitConversion';

export const useProductionData = () => {
  const [productionData, setProductionData] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Request tracking to prevent race conditions
  const currentRequestRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Process meals as individual line items
  const processMealLineItems = useCallback((orders: any[]): MealLineItem[] => {
    const mealLineItems: { [key: string]: MealLineItem } = {};

    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const mealName = item.meal_name?.trim();
        if (!mealName) return;
        
        if (!mealLineItems[mealName]) {
          mealLineItems[mealName] = {
            mealName,
            totalQuantity: 0,
            orders: []
          };
        }

        mealLineItems[mealName].totalQuantity += item.quantity || 0;
        mealLineItems[mealName].orders.push({
          orderId: order.id,
          quantity: item.quantity || 0,
          customerName: order.customer_name
        });
      });
    });

    return Object.values(mealLineItems);
  }, []);

  // Process ingredients from meal line items with retry capability
  const processIngredientLineItems = useCallback(async (
    mealLineItems: MealLineItem[], 
    requestId: string,
    retryCount = 0
  ): Promise<IngredientLineItem[]> => {
    const ingredientMap: { [key: string]: IngredientLineItem } = {};
    const mealNames = Array.from(new Set(mealLineItems.map(item => item.mealName)));
    
    if (mealNames.length === 0) return [];

    const maxRetries = 2;
    
    try {
      setIngredientsError(null);
      
      console.log(`[Kitchen Production] Processing ingredients for ${mealLineItems.length} meal types`);
      
      // Fetch meal ingredients for all meals
      const { data: mealsWithIngredients, error } = await supabase
        .from('meals')
        .select(`
          name,
          meal_ingredients (
            quantity,
            unit,
            ingredients (
              name,
              default_unit
            )
          )
        `)
        .in('name', mealNames);

      if (error) throw error;

      // Process each meal's ingredients with unit conversion
      const ingredientAggregations: { [key: string]: Array<{ quantity: number; unit: string; mealData: any }> } = {};
      
      mealLineItems.forEach(mealItem => {
        const mealData = mealsWithIngredients?.find(m => m.name === mealItem.mealName);
        
        if (mealData?.meal_ingredients) {
          mealData.meal_ingredients.forEach((mealIngredient: any) => {
            if (!mealIngredient.ingredients) return;
            
            const ingredientName = mealIngredient.ingredients.name;
            const quantityPerMeal = mealIngredient.quantity || 0;
            const unit = mealIngredient.unit || mealIngredient.ingredients.default_unit || 'g';
            const totalQuantityForThisIngredient = quantityPerMeal * mealItem.totalQuantity;

            if (!ingredientAggregations[ingredientName]) {
              ingredientAggregations[ingredientName] = [];
            }
            
            ingredientAggregations[ingredientName].push({
              quantity: totalQuantityForThisIngredient,
              unit,
              mealData: {
                mealName: mealItem.mealName,
                orderCount: mealItem.orders.length,
                quantityPerMeal,
                totalMealQuantity: mealItem.totalQuantity
              }
            });
          });
        }
      });

      // Convert aggregations to ingredient line items with proper unit handling
      Object.entries(ingredientAggregations).forEach(([ingredientName, quantities]) => {
        // Validate unit compatibility
        const units = quantities.map(q => q.unit);
        const unitCheck = canAggregateUnits(units);
        
        // Aggregate quantities using unit conversion
        const aggregated = aggregateQuantities(quantities);
        
        if (!unitCheck.canAggregate) {
          console.warn(`[Unit Conversion] Incompatible units for ${ingredientName}: ${unitCheck.reason}. Units found: ${units.join(', ')}`);
          // Continue processing with warning - use unit conversion to normalize
        } else if (units.length > 1) {
          console.log(`[Unit Conversion] Converting mixed units for ${ingredientName}: ${units.join(', ')} → ${aggregated.baseUnit}`);
        }
        
        ingredientMap[ingredientName] = {
          ingredientName,
          totalQuantity: Number(aggregated.baseValue.toFixed(1)),
          unit: aggregated.baseUnit,
          mealBreakdown: quantities.map(q => {
            const converted = convertToBaseUnit(q.quantity, q.unit);
            return {
              mealName: q.mealData.mealName,
              quantity: Number(converted.baseValue.toFixed(1)),
              unit: converted.baseUnit,
              orderCount: q.mealData.orderCount
            };
          })
        };
      });

      const ingredientCount = Object.keys(ingredientMap).length;
      console.log(`[Kitchen Production] Successfully processed ${ingredientCount} unique ingredients with unit normalization`);

      return Object.values(ingredientMap);
    } catch (error) {
      console.error(`Error processing ingredients (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: wait 1s, then 2s, then 4s
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return processIngredientLineItems(mealLineItems, requestId, retryCount + 1);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setIngredientsError(errorMessage);
        throw error;
      }
    }
  }, []);

  const loadProductionData = useCallback(async (selectedDate: Date) => {
    if (!selectedDate) return;
    
    // Cancel previous request if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new request ID and abort controller
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    currentRequestRef.current = requestId;
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);

      // Fetch orders for the selected production date
      const [ordersRes, packageOrdersRes] = await Promise.all([
        supabase.from("orders").select(`
          id,
          status,
          customer_name,
          production_date,
          requested_delivery_date,
          created_at,
          order_items (
            meal_id,
            meal_name,
            quantity
          )
        `).in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery']),
        
        supabase.from("package_orders").select(`
          id,
          status,
          customer_name,
          production_date,
          requested_delivery_date,
          created_at,
          package_meal_selections (
            meal_id,
            quantity
          ),
          packages (
            name
          )
        `).in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (packageOrdersRes.error) throw packageOrdersRes.error;

      const orders = ordersRes.data || [];
      const packageOrders = packageOrdersRes.data || [];

      // Filter orders for the selected production date
      const filteredOrders = orders.filter(order => {
        if (order.production_date) {
          const orderProductionDate = new Date(order.production_date);
          return orderProductionDate.toDateString() === selectedDate.toDateString();
        }
        
        try {
          const createdDate = new Date(order.created_at);
          return createdDate.toDateString() === selectedDate.toDateString();
        } catch (error) {
          console.error('Error parsing date for order:', order.id, error);
          return false;
        }
      });

      const filteredPackageOrders = packageOrders.filter(order => {
        if (order.production_date) {
          const orderProductionDate = new Date(order.production_date);
          return orderProductionDate.toDateString() === selectedDate.toDateString();
        }
        
        try {
          const createdDate = new Date(order.created_at);
          return createdDate.toDateString() === selectedDate.toDateString();
        } catch (error) {
          console.error('Error parsing package order date:', order.id, error);
          return false;
        }
      });

      // Fetch actual meal names for package orders
      const packageMealIds = filteredPackageOrders.flatMap(pkg => 
        pkg.package_meal_selections?.map(selection => selection.meal_id) || []
      );
      
      let packageMeals: any[] = [];
      if (packageMealIds.length > 0) {
        const { data: mealsData } = await supabase
          .from('meals')
          .select('id, name')
          .in('id', packageMealIds);
        packageMeals = mealsData || [];
      }

      // Convert package orders to same format as regular orders with proper meal names
      const normalizedPackageOrders = filteredPackageOrders.map(pkg => ({
        ...pkg,
        order_items: pkg.package_meal_selections?.map(selection => {
          const meal = packageMeals.find(m => m.id === selection.meal_id);
          return {
            meal_id: selection.meal_id,
            meal_name: meal?.name || 'Unknown Meal',
            quantity: selection.quantity
          };
        }) || []
      }));

      const allOrders = [...filteredOrders, ...normalizedPackageOrders];
      const mealLineItems = processMealLineItems(allOrders);
      
      const totalMeals = mealLineItems.reduce((sum, meal) => sum + meal.totalQuantity, 0);

      // Initialize production data with meals first
      const initialData: ProductionSummary = {
        productionDate: selectedDate,
        totalMeals,
        uniqueMealTypes: mealLineItems.length,
        mealLineItems,
        ingredientLineItems: [],
        totalIngredients: 0,
        uniqueIngredientTypes: 0
      };

      setProductionData(initialData);

      // Process ingredients separately to avoid blocking the UI
      setIngredientsLoading(true);
      try {
        // Check if this request is still current before processing
        if (currentRequestRef.current !== requestId) {
          return; // Silently exit if request was superseded
        }
        
        const ingredientLineItems = await processIngredientLineItems(mealLineItems, requestId);
        
        // Double-check request is still current before updating state
        if (currentRequestRef.current !== requestId) {
          return; // Silently exit if request was superseded during processing
        }
        
        const totalIngredients = ingredientLineItems.reduce((sum, ingredient) => sum + ingredient.totalQuantity, 0);

        setProductionData(prev => prev ? {
          ...prev,
          ingredientLineItems,
          totalIngredients,
          uniqueIngredientTypes: ingredientLineItems.length
        } : null);
      } catch (ingredientError) {
        // Only show error if this is still the current request
        if (currentRequestRef.current === requestId) {
          console.error('Error processing ingredients:', ingredientError);
          toast({
            title: "Ingredient Processing Failed",
            description: "Failed to load ingredient requirements. Meal data is still available.",
            variant: "destructive",
          });
        }
      } finally {
        // Only update loading state if this is still the current request
        if (currentRequestRef.current === requestId) {
          setIngredientsLoading(false);
        }
      }

    } catch (error) {
      console.error('Error loading production data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load production data for the selected date.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [processMealLineItems, processIngredientLineItems, toast]);

  const retryIngredientProcessing = useCallback(async () => {
    if (!productionData?.mealLineItems.length) return;
    
    // Create new request ID for retry
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    currentRequestRef.current = requestId;
    
    setIngredientsLoading(true);
    setIngredientsError(null);
    
    try {
      const ingredientLineItems = await processIngredientLineItems(productionData.mealLineItems, requestId);
      
      // Check if request is still current before updating state
      if (currentRequestRef.current !== requestId) {
        return; // Silently exit if request was superseded
      }
      
      const totalIngredients = ingredientLineItems.reduce((sum, ingredient) => sum + ingredient.totalQuantity, 0);

      setProductionData(prev => prev ? {
        ...prev,
        ingredientLineItems,
        totalIngredients,
        uniqueIngredientTypes: ingredientLineItems.length
      } : null);

      toast({
        title: "Success",
        description: "Ingredient requirements loaded successfully.",
      });
    } catch (error) {
      // Only show error if this is still the current request
      if (currentRequestRef.current === requestId) {
        console.error('Retry failed:', error);
        toast({
          title: "Retry Failed",
          description: "Still unable to load ingredient requirements. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setIngredientsLoading(false);
      }
    }
  }, [productionData?.mealLineItems, processIngredientLineItems, toast]);

  return {
    productionData,
    loading,
    ingredientsLoading,
    ingredientsError,
    loadProductionData,
    retryIngredientProcessing
  };
};