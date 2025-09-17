import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "./useErrorHandler";
import { useToast } from "./use-toast";
import type { BaseEntity } from "@/types/common";
import type { 
  DataManagerConfig, 
  DataManagerResult, 
  CrudResponse,
  ApiError,
  ApiErrorCode 
} from "@/types/api";

// Enhanced data manager with better error handling, caching, and performance
export const useEnhancedDataManager = <T extends { id: string }>(
  tableName: string,
  config: DataManagerConfig = {}
): DataManagerResult<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  
  const { handleError, createApiError } = useErrorHandler();
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Safe state updates
  const safeSetState = useCallback((updateFn: () => void) => {
    if (isMountedRef.current) {
      updateFn();
    }
  }, []);

  // Build query with filters
  const buildQuery = useCallback(() => {
    let query = (supabase as any)
      .from(tableName)
      .select(config.select || '*', { count: 'exact' });

    // Apply filters
    if (config.filters) {
      config.filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
    }

    // Apply ordering
    if (config.orderBy) {
      query = query.order(config.orderBy.column, { 
        ascending: config.orderBy.ascending ?? true 
      });
    }

    return query;
  }, [tableName, config]);

  // Fetch data with proper error handling
  const fetchData = useCallback(async (): Promise<T[]> => {
    try {
      setError(null);
      setLoading(true);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const query = buildQuery();
      const { data: fetchedData, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const typedData = (fetchedData || []) as unknown as T[];
      
      safeSetState(() => {
        setData(typedData);
        setTotal(count || 0);
        setLastFetched(new Date());
      });

      return typedData;
    } catch (err: any) {
      const apiError = handleError(err, `fetch-${String(tableName)}`);
      safeSetState(() => {
        setError(apiError);
      });
      throw apiError;
    } finally {
      safeSetState(() => {
        setLoading(false);
      });
    }
  }, [buildQuery, handleError, tableName, safeSetState]);

  // Create operation
  const create = useCallback(async (
    item: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CrudResponse<T>> => {
    try {
      const { data: created, error: createError } = await (supabase as any)
        .from(tableName)
        .insert(item as any)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      const typedCreated = created as unknown as T;
      
      // Optimistic update
      safeSetState(() => {
        setData(prev => [...prev, typedCreated]);
        setTotal(prev => prev + 1);
      });

      toast({
        title: "Success",
        description: "Item created successfully",
      });

      return { data: typedCreated, error: null, success: true };
    } catch (err: any) {
      const apiError = handleError(err, `create-${String(tableName)}`);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
      return { data: null, error: apiError, success: false };
    }
  }, [tableName, handleError, toast, safeSetState]);

  // Update operation
  const update = useCallback(async (
    id: string,
    updates: Partial<Omit<T, 'id' | 'created_at'>>
  ): Promise<CrudResponse<T>> => {
    try {
      const { data: updated, error: updateError } = await (supabase as any)
        .from(tableName)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const typedUpdated = updated as unknown as T;
      
      // Optimistic update
      safeSetState(() => {
        setData(prev => prev.map(item => 
          item.id === id ? typedUpdated : item
        ));
      });

      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      return { data: typedUpdated, error: null, success: true };
    } catch (err: any) {
      const apiError = handleError(err, `update-${String(tableName)}`);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
      return { data: null, error: apiError, success: false };
    }
  }, [tableName, handleError, toast, safeSetState]);

  // Delete operation
  const remove = useCallback(async (id: string): Promise<CrudResponse<boolean>> => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Optimistic update
      safeSetState(() => {
        setData(prev => prev.filter(item => item.id !== id));
        setTotal(prev => prev - 1);
      });

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      return { data: true, error: null, success: true };
    } catch (err: any) {
      const apiError = handleError(err, `delete-${String(tableName)}`);
      toast({
        title: "Error",
        description: apiError.message,
        variant: "destructive",
      });
      return { data: false, error: apiError, success: false };
    }
  }, [tableName, handleError, toast, safeSetState]);

  // Toggle operation (for boolean fields)
  const toggle = useCallback(async (
    id: string, 
    field: string = 'is_active'
  ): Promise<CrudResponse<T>> => {
    try {
      const currentItem = data.find(item => item.id === id);
      if (!currentItem) {
        throw new Error('Item not found');
      }

      const currentValue = (currentItem as any)[field];
      const newValue = !currentValue;

      return await update(id, { [field]: newValue } as Partial<T>);
    } catch (err: any) {
      const apiError = handleError(err, `toggle-${String(tableName)}`);
      return { data: null, error: apiError, success: false };
    }
  }, [data, update, handleError, tableName]);

  // Optimistic data updates
  const setOptimisticData = useCallback((newData: T[]) => {
    safeSetState(() => {
      setData(newData);
    });
  }, [safeSetState]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    safeSetState(() => {
      setLastFetched(null);
    });
  }, [safeSetState]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchData().catch(() => {
      // Error already handled in fetchData
    });
  }, [fetchData, ...(config.dependencies || [])]);

  return {
    data,
    loading,
    error,
    total,
    lastFetched,
    refetch: fetchData,
    create,
    update,
    remove,
    toggle,
    setOptimisticData,
    invalidateCache
  };
};