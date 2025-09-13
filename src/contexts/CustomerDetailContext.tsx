import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomerDetailContextType {
  isOpen: boolean;
  customerId: string | null;
  openCustomerDetail: (customerId: string) => void;
  closeCustomerDetail: () => void;
}

const CustomerDetailContext = createContext<CustomerDetailContextType | undefined>(undefined);

export const useCustomerDetail = () => {
  const context = useContext(CustomerDetailContext);
  if (!context) {
    throw new Error('useCustomerDetail must be used within a CustomerDetailProvider');
  }
  return context;
};

interface CustomerDetailProviderProps {
  children: ReactNode;
}

export const CustomerDetailProvider: React.FC<CustomerDetailProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const openCustomerDetail = (id: string) => {
    setCustomerId(id);
    setIsOpen(true);
  };

  const closeCustomerDetail = () => {
    setIsOpen(false);
    setCustomerId(null);
  };

  return (
    <CustomerDetailContext.Provider value={{
      isOpen,
      customerId,
      openCustomerDetail,
      closeCustomerDetail,
    }}>
      {children}
    </CustomerDetailContext.Provider>
  );
};