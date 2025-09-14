import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Meal, Category } from "@/types/meal";

export const useMealsData = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setMeals(data || []);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch meals", 
        variant: "destructive" 
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch categories", 
        variant: "destructive" 
      });
    }
  };

  const toggleMealActive = async (meal: Meal) => {
    try {
      const { error } = await supabase
        .from("meals")
        .update({ is_active: !meal.is_active })
        .eq("id", meal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Meal ${!meal.is_active ? 'activated' : 'deactivated'} successfully`,
      });

      fetchMeals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update meal status",
        variant: "destructive",
      });
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMeals(), fetchCategories()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    meals,
    categories,
    loading,
    fetchMeals,
    fetchCategories,
    toggleMealActive,
    refetch: fetchAllData
  };
};