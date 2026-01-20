import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfDay, endOfDay } from 'date-fns';
import type { MealLineItem, IngredientLineItem, ProductionSummary } from '@/types/kitchen';
import { aggregateQuantities, canAggregateUnits, formatQuantity, convertToBaseUnit } from '@/lib/unitConversion';
import { filterOrdersByCollectionDate, isValidProductionDate } from '@/lib/dateUtils';

export const useProductionData = () => {
  const [productionData, setProductionData] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [dataValidationWarnings, setDataValidationWarnings] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  // Request tracking to prevent race conditions and memory leaks
  const currentRequestRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup on unmount and prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // Mark as unmounted
      isMountedRef.current = false;
      
      // Cancel pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      
      // Reset request tracking
      currentRequestRef.current = null;
    };
  }, []);

  // Safe state update helper - only if component is still mounted
  const safeSetState = useCallback((updateFn: () => void): void => {
    if (isMountedRef.current) {
      updateFn();
    }
  }, []);

  // Validate meal data completeness and integrity
  const validateMealData = useCallback((mealsWithIngredients: any[], expectedMealNames: string[]) => {
    const warnings: string[] = [];
    const validMeals: any[] = [];
    const missingMeals: string[] = [];
    const incompleteMeals: string[] = [];

    expectedMealNames.forEach(mealName => {
      const mealData = mealsWithIngredients?.find(m => m.name === mealName);
      
      if (!mealData) {
        missingMeals.push(mealName);
        warnings.push(`Missing meal data for "${mealName}" - orders will be skipped`);
        return;
      }

      // Check if meal has ingredient data
      if (!mealData.meal_ingredients || mealData.meal_ingredients.length === 0) {
        incompleteMeals.push(mealName);
        warnings.push(`No ingredients defined for meal "${mealName}" - will not contribute to ingredient calculations`);
        validMeals.push(mealData); // Still include for tracking, just no ingredients
        return;
      }

      // Check for incomplete ingredient data
      const incompleteIngredients = mealData.meal_ingredients.filter((ing: any) => 
        !ing.ingredients || !ing.ingredients.name || ing.quantity == null
      );

      if (incompleteIngredients.length > 0) {
        warnings.push(`Incomplete ingredient data in "${mealName}" - ${incompleteIngredients.length} ingredients missing details`);
      }

      // Filter out incomplete ingredients but keep the meal
      const validIngredients = mealData.meal_ingredients.filter((ing: any) => 
        ing.ingredients && ing.ingredients.name && ing.quantity != null
      );

      validMeals.push({
        ...mealData,
        meal_ingredients: validIngredients
      });
    });

    // Log summary
    if (missingMeals.length > 0) {
      console.warn(`[Data Validation] ${missingMeals.length} meals missing from database:`, missingMeals);
    }
    if (incompleteMeals.length > 0) {
      console.warn(`[Data Validation] ${incompleteMeals.length} meals have no ingredients:`, incompleteMeals);
    }

    return {
      validMeals,
      warnings,
      missingMeals,
      incompleteMeals,
      totalExpected: expectedMealNames.length,
      totalValid: validMeals.length
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

      // Validate meal data completeness before processing
      const validationResults = validateMealData(mealsWithIngredients, mealNames);
      if (validationResults.warnings.length > 0) {
        setDataValidationWarnings(validationResults.warnings);
        console.warn('[Data Validation] Meal data issues found:', validationResults.warnings);
      }

      // Use only validated meals for processing
      const validMeals = validationResults.validMeals;

      // Process each meal's ingredients with unit conversion
      const ingredientAggregations: { [key: string]: Array<{ quantity: number; unit: string; mealData: any }> } = {};
      
      mealLineItems.forEach(mealItem => {
        const mealData = validMeals?.find(m => m.name === mealItem.mealName);
        
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
        
        // Use timeout with cleanup tracking
        const timeoutPromise = new Promise<void>(resolve => {
          const timeout = setTimeout(() => {
            timeoutRefs.current.delete(timeout);
            resolve();
          }, delay);
          timeoutRefs.current.add(timeout);
        });
        
        await timeoutPromise;
        
        // Check if still mounted before retry
        if (!isMountedRef.current) {
          throw new Error('Component unmounted during retry');
        }
        
        return processIngredientLineItems(mealLineItems, requestId, retryCount + 1);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Safe state update
        if (isMountedRef.current) {
          setIngredientsError(errorMessage);
        }
        
        throw error;
      }
    }
  }, []);

  const loadProductionData = useCallback(async (selectedDate: Date) => {
    // Validate input date first
    if (!selectedDate || !isValidProductionDate(selectedDate)) {
      console.error('[Production Data] Invalid date provided:', selectedDate);
      toast({
        title: "Invalid Date",
        description: "Please select a valid date for production data.",
        variant: "destructive",
      });
      return;
    }
    
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

      // Fetch orders for the selected collection/delivery date
      const [ordersRes, packageOrdersRes] = await Promise.all([
        supabase.from("orders").select(`
          id,
          status,
          customer_name,
          requested_delivery_date,
          created_at,
          order_items (
            meal_id,
            meal_name,
            quantity
          )
        `).in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']),
        
        supabase.from("package_orders").select(`
          id,
          status,
          customer_name,
          requested_delivery_date,
          created_at,
          package_meal_selections (
            meal_id,
            quantity
          ),
          packages (
            name
          )
        `).in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'])
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (packageOrdersRes.error) throw packageOrdersRes.error;

      const orders = ordersRes.data || [];
      const packageOrders = packageOrdersRes.data || [];

      // Use enhanced date filtering with proper validation - filter by collection/delivery date
      console.log(`[Production Data] Filtering ${orders.length} orders and ${packageOrders.length} package orders for collection date ${selectedDate.toISOString().split('T')[0]}`);
      
      const filteredOrders = filterOrdersByCollectionDate(orders, selectedDate);
      const filteredPackageOrders = filterOrdersByCollectionDate(packageOrders, selectedDate);

      // Fetch actual meal names for package orders with validation
      const packageMealIds = filteredPackageOrders.flatMap(pkg => 
        pkg.package_meal_selections?.map(selection => selection.meal_id) || []
      );
      
      let packageMeals: any[] = [];
      const packageValidationWarnings: string[] = [];
      
      if (packageMealIds.length > 0) {
        const uniqueMealIds = [...new Set(packageMealIds)];
        console.log(`[Package Validation] Validating ${uniqueMealIds.length} unique meal IDs from packages`);
        
        const { data: mealsData, error: mealFetchError } = await supabase
          .from('meals')
          .select('id, name, is_active')
          .in('id', uniqueMealIds);
          
        if (mealFetchError) {
          console.error('[Package Validation] Error fetching meal data:', mealFetchError);
          packageValidationWarnings.push('Failed to validate package meal references');
        } else {
          packageMeals = mealsData || [];
          
          // Check for missing or inactive meals
          const foundMealIds = new Set(packageMeals.map(m => m.id));
          const missingMealIds = uniqueMealIds.filter(id => !foundMealIds.has(id));
          const inactiveMeals = packageMeals.filter(m => !m.is_active);
          
          if (missingMealIds.length > 0) {
            packageValidationWarnings.push(`${missingMealIds.length} package meals not found in database`);
            console.warn('[Package Validation] Missing meal IDs:', missingMealIds);
          }
          
          if (inactiveMeals.length > 0) {
            packageValidationWarnings.push(`${inactiveMeals.length} package meals are inactive: ${inactiveMeals.map(m => m.name).join(', ')}`);
            console.warn('[Package Validation] Inactive meals:', inactiveMeals.map(m => m.name));
          }
          
          console.log(`[Package Validation] Successfully validated ${packageMeals.length}/${uniqueMealIds.length} meal references`);
        }
      }

      // Convert package orders to same format as regular orders with validation
      const normalizedPackageOrders = filteredPackageOrders.map(pkg => ({
        ...pkg,
        order_items: pkg.package_meal_selections?.map(selection => {
          const meal = packageMeals.find(m => m.id === selection.meal_id);
          if (!meal) {
            console.warn(`[Package Validation] Package order ${pkg.id} references unknown meal ID: ${selection.meal_id}`);
          }
          return {
            meal_id: selection.meal_id,
            meal_name: meal?.name || `Unknown Meal (${selection.meal_id})`,
            quantity: selection.quantity
          };
        }).filter(item => item.meal_name !== `Unknown Meal (${item.meal_id})`) || [] // Filter out unknown meals
      })).filter(pkg => pkg.order_items.length > 0); // Filter out packages with no valid meals

      // Combine validation warnings
      const allValidationWarnings = [...packageValidationWarnings];
      if (allValidationWarnings.length > 0) {
        setDataValidationWarnings(prev => [...prev, ...allValidationWarnings]);
      }

      const allOrders = [...filteredOrders, ...normalizedPackageOrders];
      console.log(`[Data Processing] Processing ${filteredOrders.length} regular orders and ${normalizedPackageOrders.length} package orders`);
      
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

      // Safe state updates with mount check
      if (isMountedRef.current) {
        setProductionData(initialData);

        // Show validation warnings to user if any
        if (dataValidationWarnings.length > 0) {
          toast({
            title: "Data Validation Warnings",
            description: `${dataValidationWarnings.length} issues found. Check console for details.`,
            variant: "destructive",
          });
        }
      }

      // Process ingredients separately to avoid blocking the UI
      if (isMountedRef.current) {
        setIngredientsLoading(true);
        setDataValidationWarnings([]); // Reset warnings for new ingredient processing
      }
      
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

        // Safe state update with mount check
        if (isMountedRef.current) {
          setProductionData(prev => prev ? {
            ...prev,
            ingredientLineItems,
            totalIngredients,
            uniqueIngredientTypes: ingredientLineItems.length
          } : null);
        }
      } catch (ingredientError) {
        // Only show error if this is still the current request and component is mounted
        if (currentRequestRef.current === requestId && isMountedRef.current) {
          console.error('Error processing ingredients:', ingredientError);
          toast({
            title: "Ingredient Processing Failed",
            description: "Failed to load ingredient requirements. Meal data is still available.",
            variant: "destructive",
          });
        }
      } finally {
        // Only update loading state if this is still the current request and component is mounted
        if (currentRequestRef.current === requestId && isMountedRef.current) {
          setIngredientsLoading(false);
        }
      }

    } catch (error) {
      console.error('Error loading production data:', error);
      
      // Safe error handling with mount check
      if (isMountedRef.current) {
        toast({
          title: "Error Loading Data",
          description: "Failed to load production data for the selected date.",
          variant: "destructive",
        });
      }
    } finally {
      // Safe loading state update
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [processMealLineItems, processIngredientLineItems, toast]);

  const retryIngredientProcessing = useCallback(async () => {
    if (!productionData?.mealLineItems.length) {
      console.warn('[Retry] No meal line items available for retry');
      return;
    }
    
    console.log(`[Retry] Retrying ingredient processing for ${productionData.mealLineItems.length} meal types`);
    
    // Create new request ID for retry
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    currentRequestRef.current = requestId;
    
    // Safe state updates with mount check
    if (isMountedRef.current) {
      setIngredientsLoading(true);
      setIngredientsError(null);
    }
    
    try {
      const ingredientLineItems = await processIngredientLineItems(productionData.mealLineItems, requestId);
      
      // Check if request is still current before updating state
      if (currentRequestRef.current !== requestId) {
        return; // Silently exit if request was superseded
      }
      
      const totalIngredients = ingredientLineItems.reduce((sum, ingredient) => sum + ingredient.totalQuantity, 0);

      // Safe state updates with mount check
      if (isMountedRef.current) {
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
      }
    } catch (error) {
      // Only show error if this is still the current request and component is mounted
      if (currentRequestRef.current === requestId && isMountedRef.current) {
        console.error('Retry failed:', error);
        toast({
          title: "Retry Failed",
          description: "Still unable to load ingredient requirements. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      // Only update loading state if this is still the current request and component is mounted
      if (currentRequestRef.current === requestId && isMountedRef.current) {
        setIngredientsLoading(false);
      }
    }
  }, [productionData?.mealLineItems, processIngredientLineItems, toast]);

  return {
    productionData,
    loading,
    ingredientsLoading,
    ingredientsError,
    dataValidationWarnings,
    selectedIngredients,
    setSelectedIngredients,
    loadProductionData,
    retryIngredientProcessing
  };
};