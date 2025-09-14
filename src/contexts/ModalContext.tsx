import React, { useState } from 'react';
import { createModalContext, ContextProviderProps } from './contextUtils';

// Generic modal provider that can handle any modal type
export const createModalProvider = <T,>(name: string) => {
  const { Context, useModal } = createModalContext<T>(name);

  const Provider: React.FC<ContextProviderProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const open = (newData: T) => {
      setData(newData);
      setIsOpen(true);
    };

    const close = () => {
      setIsOpen(false);
      setData(null);
    };

    return (
      <Context.Provider value={{ isOpen, data, open, close }}>
        {children}
      </Context.Provider>
    );
  };

  return { Provider, useModal };
};

// Customer detail modal using the generic modal system
const { Provider: CustomerDetailProvider, useModal: useCustomerDetail } = 
  createModalProvider<string>('CustomerDetail');

export { CustomerDetailProvider, useCustomerDetail };