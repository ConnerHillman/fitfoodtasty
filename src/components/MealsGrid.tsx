import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import MealCard from "./MealCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LuxuryCategorySelector from "./LuxuryCategorySelector";

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
  shelf_life_days: number;
  image_url?: string;
  created_at: string;
  sort_order: number;
}

const MealsGrid = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("regular");
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

  // Map button values to database category names
  const getCategoryFilter = (buttonValue: string) => {
    switch (buttonValue) {
      case "regular":
        return "regular";
      case "massive meals":
        return "massive meals";
      case "lowcal":
        return "(lowcal)";
      case "all":
        return null; // Show all meals
      default:
        return buttonValue;
    }
  };

  const filteredMeals = selectedCategory === "all" 
    ? meals 
    : meals.filter(meal => meal.category === getCategoryFilter(selectedCategory));

  // Create display categories in the correct order
  const displayCategories = [
    { value: "regular", label: "Regular" },
    { value: "massive meals", label: "Massive Meals" },
    { value: "lowcal", label: "Lowcal" },
    { value: "all", label: "All Meals" }
  ];

  const handleAddToCart = (meal: Meal) => {
    addToCart(meal);
    toast({
      title: "Added to Cart!",
      description: `${meal.name} has been added to your cart`,
      variant: "success" as any,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Luxury Category Selector */}
      <LuxuryCategorySelector
        categories={displayCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Meals Count */}
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground text-base sm:text-lg text-center">
          {filteredMeals.length} premium meal{filteredMeals.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Meals Grid */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-base sm:text-lg">No meals available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
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