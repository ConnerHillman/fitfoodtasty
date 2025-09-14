import { createContext, useContext, ReactNode } from 'react';

// Generic modal context creator - reduces duplication
export const createModalContext = <T,>(name: string) => {
  interface ModalContextType<T> {
    isOpen: boolean;
    data: T | null;
    open: (data: T) => void;
    close: () => void;
  }

  const Context = createContext<ModalContextType<T> | undefined>(undefined);

  const useModal = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return context;
  };

  return { Context, useModal };
};

// Generic context hook creator
export const createContextHook = <T,>(context: React.Context<T | undefined>, name: string) => {
  return () => {
    const ctx = useContext(context);
    if (ctx === undefined) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return ctx;
  };
};

// Common context provider props
export interface ContextProviderProps {
  children: ReactNode;
}