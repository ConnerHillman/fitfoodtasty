import React, { createContext, useReducer, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import { createContextHook, ContextProviderProps } from './contextUtils';
import type { CartItem, CartContextType } from '@/types/cart';

// Cart state and actions for better state management
interface CartState {
  items: CartItem[];
}

type CartAction = 
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'ADD_PACKAGE'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { items: action.payload };
    
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
      return { items: [] };
    
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = createContextHook(CartContext, 'Cart');

export const CartProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
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

  const value: CartContextType = {
    items: state.items,
    addToCart,
    addPackageToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems: calculations.getTotalItems,
    getTotalPrice: calculations.getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};