import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Generic data fetching hook with common patterns
export const useSupabaseData = <T>(
  config: {
    table: string;
    select?: string;
    filters?: Array<{ column: string; operator: string; value: any }>;
    orderBy?: { column: string; ascending?: boolean };
    dependencies?: any[];
  }
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from(config.table)
        .select(config.select || "*");

      // Apply filters
      if (config.filters) {
        config.filters.forEach(filter => {
          switch (filter.operator) {
            case 'eq':
              query = query.eq(filter.column, filter.value);
              break;
            case 'neq':
              query = query.neq(filter.column, filter.value);
              break;
            case 'gte':
              query = query.gte(filter.column, filter.value);
              break;
            case 'lte':
              query = query.lte(filter.column, filter.value);
              break;
            case 'in':
              query = query.in(filter.column, filter.value);
              break;
          }
        });
      }

      // Apply ordering
      if (config.orderBy) {
        query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true });
      }

      const { data: result, error } = await query;

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error(`Error fetching ${config.table}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${config.table}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [config.table, JSON.stringify(config.filters), JSON.stringify(config.orderBy)]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...(config.dependencies || [])]);

  return {
    data,
    loading,
    refetch: fetchData,
    setData
  };
};

// Hook for CRUD operations with consistent error handling
export const useSupabaseCrud = <T extends { id: string }>(tableName: string) => {
  const { toast } = useToast();

  const create = async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${tableName} created successfully`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create ${tableName}`,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const update = async (id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${tableName} updated successfully`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update ${tableName}`,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${tableName} deleted successfully`,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete ${tableName}`,
        variant: "destructive",
      });
      return { error };
    }
  };

  const toggle = async (id: string, field: string = 'is_active') => {
    try {
      // First fetch current value
      const { data: current, error: fetchError } = await (supabase as any)
        .from(tableName)
        .select(field)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the value
      const newValue = !current[field];
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update({ [field]: newValue })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${tableName} ${newValue ? 'activated' : 'deactivated'} successfully`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to toggle ${tableName}`,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  return {
    create,
    update,
    remove,
    toggle
  };
};