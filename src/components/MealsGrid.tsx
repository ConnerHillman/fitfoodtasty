import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import MealCard from "./MealCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LuxuryCategorySelector from "./LuxuryCategorySelector";
import { Search, X, SlidersHorizontal } from "lucide-react";

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

type SortOption = "default" | "price-asc" | "price-desc" | "cal-asc" | "cal-desc" | "protein-desc";

type QuickFilter = "high-protein" | "low-carb" | "under-500" | "under-8";

const quickFilterOptions: { id: QuickFilter; label: string }[] = [
  { id: "high-protein", label: "High Protein 30g+" },
  { id: "low-carb", label: "Low Carb <30g" },
  { id: "under-500", label: "Under 500 cal" },
  { id: "under-8", label: "Under £8" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "cal-asc", label: "Calories: Low to High" },
  { value: "cal-desc", label: "Calories: High to Low" },
  { value: "protein-desc", label: "Protein: High to Low" },
];

const MealsGrid = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("regular");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

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
        return null;
      default:
        return buttonValue;
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedSearch.trim() !== "" || sortBy !== "default" || quickFilters.length > 0;
  }, [debouncedSearch, sortBy, quickFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSortBy("default");
    setQuickFilters([]);
  };

  // Toggle quick filter
  const toggleQuickFilter = (filter: QuickFilter) => {
    setQuickFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Filtered and sorted meals
  const filteredMeals = useMemo(() => {
    let result = meals;

    // Category filter
    if (selectedCategory !== "all") {
      const categoryValue = getCategoryFilter(selectedCategory);
      if (categoryValue) {
        result = result.filter(meal => meal.category === categoryValue);
      }
    }

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(meal =>
        meal.name.toLowerCase().includes(query) ||
        meal.description.toLowerCase().includes(query)
      );
    }

    // Quick filters
    if (quickFilters.includes("high-protein")) {
      result = result.filter(meal => meal.total_protein >= 30);
    }
    if (quickFilters.includes("low-carb")) {
      result = result.filter(meal => meal.total_carbs < 30);
    }
    if (quickFilters.includes("under-500")) {
      result = result.filter(meal => meal.total_calories < 500);
    }
    if (quickFilters.includes("under-8")) {
      result = result.filter(meal => meal.price < 8);
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "cal-asc":
        result = [...result].sort((a, b) => a.total_calories - b.total_calories);
        break;
      case "cal-desc":
        result = [...result].sort((a, b) => b.total_calories - a.total_calories);
        break;
      case "protein-desc":
        result = [...result].sort((a, b) => b.total_protein - a.total_protein);
        break;
      default:
        result = [...result].sort((a, b) => a.sort_order - b.sort_order);
    }

    return result;
  }, [meals, selectedCategory, debouncedSearch, sortBy, quickFilters]);

  // Create display categories in the correct order
  const displayCategories = [
    { value: "regular", label: "Regular" },
    { value: "massive meals", label: "Massive Meals" },
    { value: "lowcal", label: "Lowcal" },
    { value: "all", label: "All Meals" }
  ];

  const handleAddToCart = (meal: Meal) => {
    addToCart(meal);
    // Non-blocking confirmation handled by FloatingCartButton
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
      {/* Search and Sort Bar */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meals... (e.g., chicken, beef, rice)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {quickFilterOptions.map(filter => (
            <Badge
              key={filter.id}
              variant={quickFilters.includes(filter.id) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${
                quickFilters.includes(filter.id) 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "hover:bg-muted"
              }`}
              onClick={() => toggleQuickFilter(filter.id)}
            >
              {filter.label}
            </Badge>
          ))}
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground ml-auto"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Luxury Category Selector */}
      <LuxuryCategorySelector
        categories={displayCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Meals Count / Search Results */}
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground text-base sm:text-lg text-center">
          {debouncedSearch.trim() ? (
            <>
              {filteredMeals.length} result{filteredMeals.length !== 1 ? 's' : ''} for "{debouncedSearch}"
            </>
          ) : (
            <>
              {filteredMeals.length} premium meal{filteredMeals.length !== 1 ? 's' : ''} available
            </>
          )}
        </div>
      </div>

      {/* Meals Grid */}
      {filteredMeals.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-base sm:text-lg">
            {debouncedSearch.trim() 
              ? `No meals found matching "${debouncedSearch}"`
              : "No meals available with these filters."
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
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
