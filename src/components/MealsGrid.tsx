import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import MealCard from "./MealCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  total_fiber: number;
  total_weight?: number;
  image_url?: string;
  created_at: string;
  sort_order: number;
}

const MealsGrid = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const { addToCart } = useCart();

  const categories = [
    { value: "all", label: "All Meals" },
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snacks" }
  ];

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const filteredMeals = selectedCategory === "all" 
    ? meals 
    : meals.filter(meal => meal.category === selectedCategory);

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
          {categories.map((category) => (
            <Skeleton key={category.value} className="h-8 w-20" />
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
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
          </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeals.map((meal) => {
            // Check if meal is new (created within 2 weeks)
            const isNew = new Date(meal.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            return (
              <MealCard
                key={meal.id}
                meal={meal}
                onAddToCart={handleAddToCart}
                showNutrition={true}
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