import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import MealCard from "./MealCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryTag from "./CategoryTag";

// Title-case labels for display only
const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_saturated_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_salt: number;
  total_weight?: number;
  image_url?: string;
  created_at: string;
  sort_order: number;
}

const MealsGrid = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMeals(), fetchCategories()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch categories", 
        variant: "destructive" 
      });
    } else {
      setCategories(data || []);
    }
  };

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch meals", 
        variant: "destructive" 
      });
    } else {
      setMeals(data || []);
    }
  };

  const filteredMeals = selectedCategory === "all" 
    ? meals 
    : meals.filter(meal => meal.category === selectedCategory);

  // Create display categories including "All Meals"
  const displayCategories = [
    { value: "all", label: "All Meals" },
    ...categories.map(cat => {
      const raw = cat.name || '';
      return { value: raw, label: toTitleCase(raw) };
    })
  ];

  const handleAddToCart = (meal: Meal) => {
    addToCart(meal);
    toast({
      title: "Added to Cart",
      description: `${meal.name} has been added to your cart`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        {displayCategories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className="transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
          >
            <CategoryTag 
              category={category.value === "all" ? "All Categories" : category.value} 
              size="md" 
              variant={selectedCategory === category.value ? "bold" : "outline"}
              className={selectedCategory === category.value ? "" : "hover:shadow-lg"}
            />
          </button>
        ))}
      </div>

      {/* Meals Count */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground">
          {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Meals Grid */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No meals available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {filteredMeals.map((meal) => {
            // Check if meal is new (created within 2 weeks)
            const isNew = new Date(meal.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            return (
              <MealCard
                key={meal.id}
                meal={meal}
                onAddToCart={handleAddToCart}
                showNutrition={true}
                showCategoryTag={false}
                isNew={isNew}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MealsGrid;