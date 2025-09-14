import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Filter, FilterFormData } from '@/types/filter';

export const useFiltersData = () => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('filters')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setFilters((data || []) as Filter[]);
    } catch (error) {
      console.error('Error fetching filters:', error);
      toast({
        title: "Error",
        description: "Failed to fetch filters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFilter = async (filterData: FilterFormData) => {
    try {
      const { data, error } = await supabase
        .from('filters')
        .insert([filterData])
        .select()
        .single();

      if (error) throw error;

      await fetchFilters();
      toast({
        title: "Success",
        description: "Filter created successfully",
      });
      return data;
    } catch (error) {
      console.error('Error creating filter:', error);
      toast({
        title: "Error",
        description: "Failed to create filter",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFilter = async (id: string, updates: Partial<FilterFormData>) => {
    try {
      const { data, error } = await supabase
        .from('filters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchFilters();
      toast({
        title: "Success",
        description: "Filter updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating filter:', error);
      toast({
        title: "Error",
        description: "Failed to update filter",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFilter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('filters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchFilters();
      toast({
        title: "Success",
        description: "Filter deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting filter:', error);
      toast({
        title: "Error",
        description: "Failed to delete filter",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleFilterActive = async (filter: Filter) => {
    await updateFilter(filter.id, { is_active: !filter.is_active });
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  return {
    filters,
    loading,
    fetchFilters,
    createFilter,
    updateFilter,
    deleteFilter,
    toggleFilterActive,
  };
};