import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { CustomerDetailProvider } from './ModalContext';
import { queryClient } from '@/lib/queryClient';
import type { ContextProviderProps } from './contextUtils';

// Consolidated app providers - reduces nesting and improves maintainability
export const AppProviders: React.FC<ContextProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <CustomerDetailProvider>
              {children}
            </CustomerDetailProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Individual providers for specific use cases
export { AuthProvider } from './AuthContext';
export { CartProvider } from './CartContext';
export { CustomerDetailProvider } from './ModalContext';