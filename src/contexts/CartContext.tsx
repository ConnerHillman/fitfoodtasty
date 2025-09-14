import React, { createContext, useReducer, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { createContextHook, ContextProviderProps } from './contextUtils';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem, CartContextType } from '@/types/cart';

// Cart state and actions for better state management
interface CartState {
  items: CartItem[];
  reorderData?: {
    originalOrderId: string;
    packageData: any;
    unavailableMeals: any[];
    replacements: Record<string, string>;
  };
}

type CartAction = 
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'ADD_PACKAGE'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_REORDER_DATA'; payload: { originalOrderId: string; packageData: any; unavailableMeals: any[] } };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    
    case 'SET_REORDER_DATA':
      return { 
        ...state, 
        reorderData: {
          ...action.payload,
          replacements: {}
        }
      };
    
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.id === action.payload.id && item.type !== 'package'
      );
      
      if (existingItem) {
        return {
          items: state.items.map(item =>
            item.id === action.payload.id && item.type !== 'package'
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      } else {
        return {
          items: [...state.items, { ...action.payload, quantity: 1, type: 'meal' }]
        };
      }
    }
    
    case 'ADD_PACKAGE':
      return {
        items: [...state.items, { ...action.payload, quantity: 1, type: 'package' }]
      };
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter(item => item.id !== action.payload.id)
        };
      }
      return {
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    }
    
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'CLEAR_CART':
      return { items: [], reorderData: undefined };
    
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = createContextHook(CartContext, 'Cart');

export const CartProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], reorderData: undefined });
  const { user } = useAuth();

  // Memoized calculations for better performance
  const calculations = useMemo(() => {
    const getTotalPrice = () => {
      return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    };

    return { getTotalPrice, getTotalItems };
  }, [state.items]);

  // Initialize abandoned cart tracking
  const { trackCartRecovery } = useAbandonedCart({
    cartItems: state.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    total: calculations.getTotalPrice(),
    customerEmail: user?.email
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        dispatch({ type: 'SET_ITEMS', payload: items });
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (meal: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: meal });
  };

  const addPackageToCart = (packageItem: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_PACKAGE', payload: packageItem });
  };

  const removeFromCart = (mealId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: mealId });
  };

  const updateQuantity = (mealId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: mealId, quantity } });
  };

  const clearCart = () => {
    // Track cart recovery when clearing (likely after successful order)
    if (state.items.length > 0) {
      trackCartRecovery();
    }
    dispatch({ type: 'CLEAR_CART' });
  };

  const startReorder = async (orderId: string, orderType: 'package' | 'regular' = 'package') => {
    if (orderType === 'package') {
      return await startPackageReorder(orderId);
    } else {
      return await startRegularOrderReorder(orderId);
    }
  };

  const startPackageReorder = async (packageOrderId: string) => {
    try {
      // Get the original package order and its meal selections
      const { data: packageOrder, error: packageError } = await supabase
        .from('package_orders')
        .select(`
          id,
          package_id,
          packages (
            id,
            name,
            meal_count,
            price,
            image_url
          )
        `)
        .eq('id', packageOrderId)
        .single();

      if (packageError) throw packageError;

      const { data: mealSelections, error: selectionsError } = await supabase
        .from('package_meal_selections')
        .select(`
          meal_id,
          quantity,
          meals (
            id,
            name,
            is_active,
            image_url,
            price,
            total_calories,
            total_protein,
            total_carbs,
            total_fat,
            total_fiber
          )
        `)
        .eq('package_order_id', packageOrderId);

      if (selectionsError) throw selectionsError;

      // Check which meals are still available
      const unavailableMeals = mealSelections.filter(selection => !selection.meals?.is_active);
      const availableMeals = mealSelections.filter(selection => selection.meals?.is_active);

      if (unavailableMeals.length === 0) {
        // All meals are still available, add to cart directly
        const packageCartItem = {
          id: `reorder-${packageOrder.id}-${Date.now()}`,
          name: packageOrder.packages.name,
          description: `Reorder of ${availableMeals.length} meals`,
          category: 'package',
          price: packageOrder.packages.price,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          total_fiber: 0,
          shelf_life_days: 5,
          image_url: packageOrder.packages.image_url,
          packageData: {
            packageId: packageOrder.packages.id,
            packageName: packageOrder.packages.name,
            mealCount: packageOrder.packages.meal_count,
            selectedMeals: availableMeals.reduce((acc, selection) => {
              if (selection.meals) {
                acc[selection.meals.id] = selection.quantity;
              }
              return acc;
            }, {} as Record<string, number>),
          },
        };

        addPackageToCart(packageCartItem);
        return { success: true, needsReplacements: false };
      } else {
        // Some meals need replacement
        dispatch({
          type: 'SET_REORDER_DATA',
          payload: {
            originalOrderId: packageOrderId,
            packageData: packageOrder.packages,
            unavailableMeals: unavailableMeals.map(selection => ({
              mealId: selection.meal_id,
              mealName: selection.meals?.name || 'Unknown meal',
              quantity: selection.quantity
            }))
          }
        });
        return { success: true, needsReplacements: true, unavailableCount: unavailableMeals.length };
      }
    } catch (error) {
      console.error('Error starting reorder:', error);
      return { success: false, error: 'Failed to start reorder' };
    }
  };

  const startRegularOrderReorder = async (orderId: string) => {
    try {
      // Get the original order with its items and coupon info
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          coupon_type,
          coupon_discount_percentage,
          coupon_discount_amount,
          coupon_free_delivery,
          coupon_free_item_id,
          order_items (
            meal_id,
            meal_name,
            quantity,
            unit_price,
            meals (
              id,
              name,
              price,
              is_active,
              image_url,
              description,
              category,
              total_calories,
              total_protein,
              total_carbs,
              total_fat,
              total_fiber,
              shelf_life_days
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Check which meals are still available
      const unavailableMeals = orderData.order_items.filter(item => !item.meals?.is_active);
      const availableMeals = orderData.order_items.filter(item => item.meals?.is_active);

      // Check if original coupon is still valid
      let couponValidationMessage = "";
      if (orderData.coupon_type) {
        const couponResult = await validateCoupon(orderData.coupon_type);
        if (couponResult.valid) {
          couponValidationMessage = ` Original coupon "${orderData.coupon_type}" is still active and can be reapplied.`;
        } else {
          couponValidationMessage = ` Note: Original coupon "${orderData.coupon_type}" has expired and cannot be reapplied.`;
        }
      }

      if (unavailableMeals.length === 0) {
        // All meals are still available, add to cart directly
        for (const item of availableMeals) {
          if (item.meals) {
            for (let i = 0; i < item.quantity; i++) {
              addToCart({
                id: item.meals.id,
                name: item.meals.name,
                description: item.meals.description || '',
                category: item.meals.category || '',
                price: item.meals.price || item.unit_price,
                total_calories: item.meals.total_calories || 0,
                total_protein: item.meals.total_protein || 0,
                total_carbs: item.meals.total_carbs || 0,
                total_fat: item.meals.total_fat || 0,
                total_fiber: item.meals.total_fiber || 0,
                shelf_life_days: item.meals.shelf_life_days || 5,
                image_url: item.meals.image_url || '',
              });
            }
          }
        }
        return { 
          success: true, 
          needsReplacements: false, 
          message: `${availableMeals.reduce((sum, item) => sum + item.quantity, 0)} meals added to cart.${couponValidationMessage}`
        };
      } else {
        // Some meals need replacement
        dispatch({
          type: 'SET_REORDER_DATA',
          payload: {
            originalOrderId: orderId,
            packageData: null, // Not a package order
            unavailableMeals: unavailableMeals.map(item => ({
              mealId: item.meal_id,
              mealName: item.meal_name,
              quantity: item.quantity
            }))
          }
        });
        
        // Add available meals to cart first
        for (const item of availableMeals) {
          if (item.meals) {
            for (let i = 0; i < item.quantity; i++) {
              addToCart({
                id: item.meals.id,
                name: item.meals.name,
                description: item.meals.description || '',
                category: item.meals.category || '',
                price: item.meals.price || item.unit_price,
                total_calories: item.meals.total_calories || 0,
                total_protein: item.meals.total_protein || 0,
                total_carbs: item.meals.total_carbs || 0,
                total_fat: item.meals.total_fat || 0,
                total_fiber: item.meals.total_fiber || 0,
                shelf_life_days: item.meals.shelf_life_days || 5,
                image_url: item.meals.image_url || '',
              });
            }
          }
        }
        
        return { 
          success: true, 
          needsReplacements: true, 
          unavailableCount: unavailableMeals.length,
          message: `${availableMeals.reduce((sum, item) => sum + item.quantity, 0)} meals added. ${unavailableMeals.length} meals need replacement.${couponValidationMessage}`
        };
      }
    } catch (error) {
      console.error('Error starting regular order reorder:', error);
      return { success: false, error: 'Failed to start reorder' };
    }
  };

  const validateCoupon = async (couponCode: string) => {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .single();
        
      if (error || !coupon) {
        return { valid: false };
      }
      
      const now = new Date();
      const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
      
      if (coupon.active && (!expiresAt || expiresAt > now)) {
        return { valid: true, coupon };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false };
    }
  };

  const value: CartContextType = {
    items: state.items,
    addToCart,
    addPackageToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems: calculations.getTotalItems,
    getTotalPrice: calculations.getTotalPrice,
    startReorder,
    reorderData: state.reorderData,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};