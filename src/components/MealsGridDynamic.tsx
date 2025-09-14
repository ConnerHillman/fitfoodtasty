import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import MealCard from "./MealCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import LuxuryCategorySelector from "./LuxuryCategorySelector";
import type { Filter as FilterType } from "@/types/filter";

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

const MealsGridDynamic = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("regular");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Dynamic filters from database
  const [availableFilters, setAvailableFilters] = useState<FilterType[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
  
  const [calorieRange, setCalorieRange] = useState<number[]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMeals(), fetchCategories(), fetchFilters()]);
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

  // Fetch dynamic filters from database
  const fetchFilters = async () => {
    try {
      const { data, error } = await supabase
        .from('filters')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAvailableFilters((data || []) as FilterType[]);
    } catch (error) {
      console.error('Error fetching filters:', error);
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

  // Enhanced filtering logic with dynamic filters
  const getFilteredAndSortedMeals = () => {
    let filtered = meals;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(meal => meal.category === getCategoryFilter(selectedCategory));
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(searchLower) ||
        meal.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply dynamic filters
    availableFilters.forEach(filter => {
      const isFilterActive = activeFilters[filter.id];
      
      if (!isFilterActive) return;

      switch (filter.type) {
        case 'dietary':
          // For dietary filters, we would need to implement based on allergen/ingredient data
          // For now, matching by category or description
          if (filter.name.toLowerCase().includes('vegan')) {
            filtered = filtered.filter(meal => 
              meal.category?.toLowerCase().includes('vegan') || 
              meal.description?.toLowerCase().includes('vegan')
            );
          }
          if (filter.name.toLowerCase().includes('gluten')) {
            filtered = filtered.filter(meal => 
              meal.category?.toLowerCase().includes('gluten') || 
              meal.description?.toLowerCase().includes('gluten')
            );
          }
          break;

        case 'nutrition':
          if (filter.threshold) {
            if (filter.threshold.min_protein) {
              filtered = filtered.filter(meal => (meal.total_protein || 0) >= filter.threshold!.min_protein);
            }
            if (filter.threshold.max_carbs) {
              filtered = filtered.filter(meal => (meal.total_carbs || 0) <= filter.threshold!.max_carbs);
            }
            if (filter.threshold.max_fat) {
              filtered = filtered.filter(meal => (meal.total_fat || 0) <= filter.threshold!.max_fat);
            }
            if (filter.threshold.min_fiber) {
              filtered = filtered.filter(meal => (meal.total_fiber || 0) >= filter.threshold!.min_fiber);
            }
          }
          break;

        case 'calorie':
          if (filter.threshold) {
            if (filter.threshold.min_calories) {
              filtered = filtered.filter(meal => (meal.total_calories || 0) >= filter.threshold!.min_calories);
            }
            if (filter.threshold.max_calories) {
              filtered = filtered.filter(meal => (meal.total_calories || 0) <= filter.threshold!.max_calories);
            }
          }
          break;
      }
    });

    // Calorie range filter (from slider)
    filtered = filtered.filter(meal => {
      const calories = meal.total_calories || 0;
      return calories >= calorieRange[0] && calories <= calorieRange[1];
    });

    // Apply dynamic sorting or fallback sorting
    const activeSortFilter = availableFilters.find(f => f.type === 'sorting' && activeFilters[f.id]);
    
    if (activeSortFilter && activeSortFilter.threshold) {
      const { field, order } = activeSortFilter.threshold;
      filtered.sort((a, b) => {
        const aVal = a[field as keyof Meal] || 0;
        const bVal = b[field as keyof Meal] || 0;
        
        if (field === 'created_at') {
          const aTime = new Date(aVal as string).getTime();
          const bTime = new Date(bVal as string).getTime();
          return order === 'asc' ? aTime - bTime : bTime - aTime;
        }
        
        return order === 'asc' ? 
          (aVal as number) - (bVal as number) : 
          (bVal as number) - (aVal as number);
      });
    } else {
      // Fallback sorting
      switch (sortBy) {
        case "price-low":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "price-high":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "calories-low":
          filtered.sort((a, b) => (a.total_calories || 0) - (b.total_calories || 0));
          break;
        case "calories-high":
          filtered.sort((a, b) => (b.total_calories || 0) - (a.total_calories || 0));
          break;
        case "newest":
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        default:
          filtered.sort((a, b) => a.sort_order - b.sort_order);
      }
    }

    return filtered;
  };

  const filteredMeals = getFilteredAndSortedMeals();

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setActiveFilters({});
    setCalorieRange([0, 1000]);
    setSortBy("name");
    setSelectedCategory("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim() !== "" || 
    Object.values(activeFilters).some(Boolean) || 
    calorieRange[0] !== 0 || calorieRange[1] !== 1000 || 
    sortBy !== "name" || selectedCategory !== "all";

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
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search meals by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter Toggle & Sort */}
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && <Badge variant="destructive" className="ml-2 h-2 w-2 p-0" />}
          </Button>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Default</SelectItem>
              {availableFilters
                .filter(filter => filter.type === 'sorting')
                .map(filter => (
                  <SelectItem 
                    key={filter.id} 
                    value={filter.id}
                    onClick={() => setActiveFilters(prev => ({ 
                      ...prev, 
                      [filter.id]: true 
                    }))}
                  >
                    {filter.name}
                  </SelectItem>
                ))}
              {/* Fallback sorting options */}
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="calories-low">Calories: Low to High</SelectItem>
              <SelectItem value="calories-high">Calories: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Dynamic Filters Sidebar */}
        <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card className="p-4 bg-gray-50/50">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="px-0 space-y-6">
              {/* Category Selector for Mobile */}
              <div className="lg:hidden">
                <h4 className="font-medium mb-3">Category</h4>
                <div className="grid grid-cols-2 gap-2">
                  {displayCategories.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className="text-xs"
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dynamic Filters */}
              {availableFilters.filter(f => f.type === 'dietary' || f.type === 'nutrition').length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Dietary & Nutrition</h4>
                  <div className="space-y-3">
                    {availableFilters
                      .filter(filter => filter.type === 'dietary' || filter.type === 'nutrition')
                      .map(filter => (
                        <div key={filter.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={filter.id}
                            checked={!!activeFilters[filter.id]}
                            onCheckedChange={(checked) =>
                              setActiveFilters(prev => ({ 
                                ...prev, 
                                [filter.id]: !!checked 
                              }))
                            }
                          />
                          <label htmlFor={filter.id} className="text-sm">
                            {filter.name}
                            {filter.threshold && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({Object.entries(filter.threshold).map(([key, value]) => 
                                  `${key.replace('_', ' ')}: ${value}`
                                ).join(', ')})
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Calorie Range */}
              <div>
                <h4 className="font-medium mb-3">Calorie Range</h4>
                <div className="space-y-3">
                  <Slider
                    value={calorieRange}
                    onValueChange={setCalorieRange}
                    max={1000}
                    min={0}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{calorieRange[0]} kcal</span>
                    <span>{calorieRange[1]} kcal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Category Selector for Desktop */}
          <div className="hidden lg:block">
            <LuxuryCategorySelector
              categories={displayCategories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </div>

          {/* Results Count and Active Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="text-muted-foreground text-base">
              {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''} found
            </div>
            
            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                {Object.entries(activeFilters).map(([filterId, isActive]) => {
                  const filter = availableFilters.find(f => f.id === filterId);
                  return isActive && filter && (
                    <Badge key={filterId} variant="secondary" className="text-xs">
                      {filter.name}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setActiveFilters(prev => ({ ...prev, [filterId]: false }))}
                      />
                    </Badge>
                  );
                })}
                {(calorieRange[0] !== 0 || calorieRange[1] !== 1000) && (
                  <Badge variant="secondary" className="text-xs">
                    {calorieRange[0]}-{calorieRange[1]} kcal
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => setCalorieRange([0, 1000])}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Meals Grid */}
          {filteredMeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-base sm:text-lg mb-4">
                {hasActiveFilters ? "No meals match your current filters." : "No meals available in this category."}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
      </div>
    </div>
  );
};

export default MealsGridDynamic;