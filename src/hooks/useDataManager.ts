import { useState, useCallback } from "react";
import { useSupabaseData, useSupabaseCrud } from "./useSupabaseData";

// Generic data manager that combines fetching and CRUD operations
export const useDataManager = <T extends { id: string }>(
  tableName: string,
  config: {
    select?: string;
    filters?: Array<{ column: string; operator: string; value: any }>;
    orderBy?: { column: string; ascending?: boolean };
    dependencies?: any[];
  } = {}
) => {
  const { data, loading, refetch, setData } = useSupabaseData<T>({
    table: tableName,
    ...config
  });

  const crud = useSupabaseCrud<T>(tableName);

  // Optimistic updates for better UX
  const createItem = useCallback(async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await crud.create(item);
    if (result.data) {
      setData(prev => [...prev, result.data as T]);
    }
    return result;
  }, [crud, setData]);

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>) => {
    const result = await crud.update(id, updates);
    if (result.data) {
      setData(prev => prev.map(item => item.id === id ? result.data as T : item));
    }
    return result;
  }, [crud, setData]);

  const removeItem = useCallback(async (id: string) => {
    const result = await crud.remove(id);
    if (!result.error) {
      setData(prev => prev.filter(item => item.id !== id));
    }
    return result;
  }, [crud, setData]);

  const toggleItem = useCallback(async (id: string, field: string = 'is_active') => {
    const result = await crud.toggle(id, field);
    if (result.data) {
      setData(prev => prev.map(item => item.id === id ? result.data as T : item));
    }
    return result;
  }, [crud, setData]);

  return {
    // Data
    data,
    loading,
    refetch,
    
    // CRUD operations with optimistic updates
    create: createItem,
    update: updateItem,
    remove: removeItem,
    toggle: toggleItem,
    
    // Raw CRUD without optimistic updates (for cases where refetch is preferred)
    rawCrud: crud
  };
};