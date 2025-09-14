import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAbandonedCart } from '@/hooks/useAbandonedCart';
import type { CartItem, CartContextType } from '@/types/cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Initialize abandoned cart tracking
  const { trackCartRecovery } = useAbandonedCart({
    cartItems: items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    total: getTotalPrice(),
    customerEmail: user?.email
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Helper function for total price (needed for abandoned cart hook)
  function getTotalPrice() {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  const addToCart = (meal: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === meal.id && item.type !== 'package');
      if (existingItem) {
        return prevItems.map(item =>
          item.id === meal.id && item.type !== 'package'
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...meal, quantity: 1, type: 'meal' }];
      }
    });
  };

  const addPackageToCart = (packageItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      // For packages, we always add a new item since each package selection is unique
      return [...prevItems, { ...packageItem, quantity: 1, type: 'package' }];
    });
  };

  const removeFromCart = (mealId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== mealId));
  };

  const updateQuantity = (mealId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(mealId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === mealId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    // Track cart recovery when clearing (likely after successful order)
    if (items.length > 0) {
      trackCartRecovery();
    }
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addPackageToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice: () => getTotalPrice(),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};