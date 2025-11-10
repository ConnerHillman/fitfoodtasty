import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ApiError, CrudResponse } from '@/types/api';

interface UseAdminCrudConfig {
  table: string;
  entityName: string;
  defaultOrderBy?: { column: string; ascending?: boolean };
  onSuccess?: {
    create?: string;
    update?: string;
    delete?: string;
  };
  onError?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}

export function useAdminCrud<T extends { id: string }>(config: UseAdminCrudConfig) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((error: any, operation: 'create' | 'update' | 'delete') => {
    console.error(`Error ${operation}ing ${config.entityName}:`, error);
    const errorMessage = config.onError?.[operation] || 
      `Failed to ${operation} ${config.entityName}`;
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    setError({
      code: 'CRUD_ERROR',
      message: errorMessage,
      details: error,
      timestamp: new Date().toISOString()
    });
  }, [config, toast]);

  const handleSuccess = useCallback((operation: 'create' | 'update' | 'delete') => {
    const successMessage = config.onSuccess?.[operation] || 
      `${config.entityName} ${operation}d successfully`;
    
    toast({
      title: "Success",
      description: successMessage,
    });
  }, [config, toast]);

  const fetchData = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Using 'as any' for dynamic table names - type safety provided by generic T
      let query = (supabase.from as any)(config.table).select('*');
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply default ordering
      if (config.defaultOrderBy) {
        query = query.order(
          config.defaultOrderBy.column, 
          { ascending: config.defaultOrderBy.ascending ?? true }
        );
      }
      
      const { data: result, error } = await query;
      
      if (error) throw error;
      
      // Runtime assertion: result matches our generic type T[]
      const typedResult = (result as unknown as T[]) || [];
      setData(typedResult);
      return typedResult;
    } catch (error) {
      handleError(error, 'create'); // Using create as generic fallback
      return [];
    } finally {
      setLoading(false);
    }
  }, [config, handleError]);

  const create = useCallback(async (item: any): Promise<CrudResponse<T>> => {
    setLoading(true);
    
    try {
      const { data: result, error } = await (supabase.from as any)(config.table)
        .insert([item])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      // Runtime assertion: result matches our generic type T
      const typedResult = result as unknown as T;
      setData(prev => [...prev, typedResult]);
      handleSuccess('create');
      
      return { data: typedResult, error: null, success: true };
    } catch (error) {
      handleError(error, 'create');
      return { data: null, error: error as ApiError, success: false };
    } finally {
      setLoading(false);
    }
  }, [config, handleError, handleSuccess]);

  const update = useCallback(async (id: string, updates: any): Promise<CrudResponse<T>> => {
    setLoading(true);
    
    try {
      const { data: result, error } = await (supabase.from as any)(config.table)
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      // Runtime assertion: result matches our generic type T
      const typedResult = result as unknown as T;
      setData(prev => prev.map(item => item.id === id ? typedResult : item));
      handleSuccess('update');
      
      return { data: typedResult, error: null, success: true };
    } catch (error) {
      handleError(error, 'update');
      return { data: null, error: error as ApiError, success: false };
    } finally {
      setLoading(false);
    }
  }, [config, handleError, handleSuccess]);

  const remove = useCallback(async (id: string): Promise<CrudResponse<boolean>> => {
    setLoading(true);
    
    try {
      const { error } = await (supabase.from as any)(config.table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setData(prev => prev.filter(item => item.id !== id));
      handleSuccess('delete');
      
      return { data: true, error: null, success: true };
    } catch (error) {
      handleError(error, 'delete');
      return { data: false, error: error as ApiError, success: false };
    } finally {
      setLoading(false);
    }
  }, [config, handleError, handleSuccess]);

  const toggle = useCallback(async (id: string, field: string = 'is_active'): Promise<CrudResponse<T>> => {
    const item = data.find(item => item.id === id);
    if (!item) {
      return { data: null, error: { code: 'NOT_FOUND', message: 'Item not found' } as ApiError, success: false };
    }
    
    // Type-safe property access using Record type
    const currentValue = (item as Record<string, unknown>)[field];
    return update(id, { [field]: !currentValue });
  }, [data, update]);

  const bulkUpdate = useCallback(async (updates: Array<{ id: string; data: any }>): Promise<boolean> => {
    setLoading(true);
    
    try {
      const promises = updates.map(({ id, data: updateData }) => 
        (supabase.from as any)(config.table).update(updateData).eq('id', id)
      );
      
      const results = await Promise.all(promises);
      
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        throw new Error('Some updates failed');
      }
      
      // Refresh data
      await fetchData();
      
      toast({
        title: "Success",
        description: `Updated ${updates.length} ${config.entityName}s`,
      });
      
      return true;
    } catch (error) {
      handleError(error, 'update');
      return false;
    } finally {
      setLoading(false);
    }
  }, [config, handleError, fetchData, toast]);

  return {
    data,
    loading,
    error,
    fetchData,
    create,
    update,
    remove,
    toggle,
    bulkUpdate,
    refetch: fetchData
  };
}