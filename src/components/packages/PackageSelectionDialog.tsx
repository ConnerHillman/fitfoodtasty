import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MealPackage } from "./PackagesBar";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Minus, Plus, CheckCircle2, ShoppingCart, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

interface Allergen {
  id: string;
  name: string;
  description?: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url?: string;
  allergens?: Allergen[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: MealPackage | null;
}

const CategoryColors: Record<string, string> = {
  breakfast: "bg-orange-100 text-orange-800 border-orange-200",
  lunch: "bg-blue-100 text-blue-800 border-blue-200",
  dinner: "bg-purple-100 text-purple-800 border-purple-200",
};

const PackageSelectionDialog = ({ open, onOpenChange, pkg }: Props) => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealAllergens, setMealAllergens] = useState<Record<string, Allergen[]>>({});
  const [mealIngredients, setMealIngredients] = useState<Record<string, Ingredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState<Record<string, boolean>>({});
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { addPackageToCart } = useCart();

  const filteredMeals = useMemo(
    () => meals.filter(meal => 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [meals, searchTerm]
  );

  const totalSelected = useMemo(
    () => Object.values(selected).reduce((a, b) => a + b, 0),
    [selected]
  );

  useEffect(() => {
    if (open) {
      setSelected({});
      setSearchTerm("");
      (async () => {
        setLoading(true);
        
        if (pkg) {
          // First get the meal IDs for this package
          const { data: packageMealData, error: packageError } = await supabase
            .from("package_meals")
            .select("meal_id")
            .eq("package_id", pkg.id);
            
          if (packageError) {
            console.error("Error fetching package meals:", packageError);
            setLoading(false);
            return;
          }
          
          // If no meals are assigned to this package, show all active meals
          if (!packageMealData || packageMealData.length === 0) {
            const { data, error } = await supabase
              .from("meals")
              .select("id,name,description,category,price,image_url,total_calories,total_protein,total_carbs,total_fat,total_fiber")
              .eq("is_active", true)
              .order("category", { ascending: true })
              .order("name", { ascending: true });
            if (!error) {
              const mealsData = (data || []) as Meal[];
              setMeals(mealsData);
              await fetchAllergensForMeals(mealsData.map(m => m.id));
            }
          } else {
            // Get the actual meal data for the assigned meals
            const mealIds = packageMealData.map(pm => pm.meal_id);
            const { data, error } = await supabase
              .from("meals")
              .select("id,name,description,category,price,image_url,total_calories,total_protein,total_carbs,total_fat,total_fiber")
              .in("id", mealIds)
              .eq("is_active", true)
              .order("category", { ascending: true })
              .order("name", { ascending: true });
            if (!error) {
              const mealsData = (data || []) as Meal[];
              setMeals(mealsData);
              await fetchAllergensForMeals(mealsData.map(m => m.id));
            }
          }
        }
        
        setLoading(false);
      })();
    }
  }, [open]);

  const fetchAllergensForMeals = async (mealIds: string[]) => {
    if (mealIds.length === 0) return;
    
    const { data, error } = await supabase
      .from("meal_allergens")
      .select(`
        meal_id,
        allergens (
          id,
          name,
          description
        )
      `)
      .in("meal_id", mealIds);

    if (!error && data) {
      const allergensMap: Record<string, Allergen[]> = {};
      data.forEach((ma: any) => {
        if (ma.allergens) {
          if (!allergensMap[ma.meal_id]) {
            allergensMap[ma.meal_id] = [];
          }
          allergensMap[ma.meal_id].push(ma.allergens);
        }
      });
      setMealAllergens(allergensMap);
    }
  };

  const fetchIngredientsForMeal = async (mealId: string) => {
    if (mealIngredients[mealId] || loadingIngredients[mealId]) return;
    
    setLoadingIngredients(prev => ({ ...prev, [mealId]: true }));
    
    try {
      const { data, error } = await supabase
        .from("meal_ingredients")
        .select(`
          quantity,
          unit,
          ingredients (
            id,
            name
          )
        `)
        .eq("meal_id", mealId);

      if (!error && data) {
        const ingredients: Ingredient[] = data.map((mi: any) => ({
          id: mi.ingredients.id,
          name: mi.ingredients.name,
          quantity: mi.quantity,
          unit: mi.unit || 'g'
        }));
        setMealIngredients(prev => ({ ...prev, [mealId]: ingredients }));
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    } finally {
      setLoadingIngredients(prev => ({ ...prev, [mealId]: false }));
    }
  };

  const handleIngredientsToggle = (mealId: string) => {
    if (!expandedIngredients[mealId] && !mealIngredients[mealId]) {
      fetchIngredientsForMeal(mealId);
    }
    setExpandedIngredients(prev => ({ ...prev, [mealId]: !prev[mealId] }));
  };

  const inc = (id: string) => {
    if (!pkg) return;
    setSelected((prev) => {
      const current = prev[id] || 0;
      const nextTotal = totalSelected + 1;
      if (nextTotal > pkg.meal_count) return prev; // enforce limit
      return { ...prev, [id]: current + 1 };
    });
  };

  const dec = (id: string) => {
    setSelected((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current - 1);
      const { [id]: _, ...rest } = prev;
      return next > 0 ? { ...prev, [id]: next } : rest;
    });
  };

  const handleAddToCart = () => {
    if (!pkg) return;
    if (totalSelected !== pkg.meal_count) {
      toast({ title: "Select meals", description: `Please select exactly ${pkg.meal_count} meals.`, variant: "destructive" });
      return;
    }

    const summary = Object.entries(selected)
      .map(([id, qty]) => {
        const meal = meals.find((m) => m.id === id);
        return `${qty} x ${meal?.name ?? "Meal"}`;
      })
      .join(" | ");

    // Create a package cart item
    const packageCartItem = {
      id: `package-${pkg.id}-${Date.now()}`, // Unique ID for each package selection
      name: `${pkg.name}`,
      description: summary,
      category: 'package',
      price: pkg.price,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      shelf_life_days: 5, // Default for packages
      image_url: pkg.image_url,
      packageData: {
        packageId: pkg.id,
        packageName: pkg.name,
        mealCount: pkg.meal_count,
        selectedMeals: selected,
      },
    };

    addPackageToCart(packageCartItem);
    toast({ 
      title: "Added to cart", 
      description: `${pkg.name} with ${totalSelected} meals added to cart.` 
    });
    onOpenChange(false);
  };

  const handleCheckout = async () => {
    if (!pkg) return;
    if (totalSelected !== pkg.meal_count) {
      toast({ title: "Select meals", description: `Please select exactly ${pkg.meal_count} meals.`, variant: "destructive" });
      return;
    }

    // Add package to cart first
    await handleAddToCart();
    
    // Navigate to cart page for collection/delivery options
    navigate('/cart');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-center text-8xl font-inter font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent animate-fade-in tracking-tight leading-tight">
            {pkg ? `Choose ${pkg.meal_count} meals` : 'Choose Meals'}
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selection status */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{totalSelected}</span> / {pkg?.meal_count ?? 0}
          </div>
          <div className="flex items-center gap-2">
            {totalSelected === (pkg?.meal_count ?? 0) ? (
              <div className="text-green-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> Ready to add
              </div>
            ) : (
              <div className="text-muted-foreground">Pick {((pkg?.meal_count ?? 0) - totalSelected)} more</div>
            )}
            <Button 
              variant="outline" 
              onClick={handleAddToCart} 
              disabled={!pkg || totalSelected !== (pkg?.meal_count ?? 0)}
              className="flex items-center gap-2"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </Button>
            <Button onClick={handleCheckout} disabled={!pkg || totalSelected !== (pkg?.meal_count ?? 0)}>
              Proceed to Checkout
            </Button>
          </div>
        </div>

        {/* Meals grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40" />
          ))}
          {!loading && filteredMeals.length === 0 && searchTerm && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No meals found matching "{searchTerm}"
            </div>
          )}
          {!loading && filteredMeals.map((meal) => {
            const qty = selected[meal.id] || 0;
            return (
              <Card key={meal.id} className="overflow-hidden">
                {meal.image_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-base">{meal.name}</CardTitle>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleIngredientsToggle(meal.id)}
                    className="mt-2 mx-auto w-fit h-6 px-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:text-green-800 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {expandedIngredients[meal.id] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    <span className="ml-1 text-xs font-medium tracking-wide">INGREDIENTS</span>
                  </Button>
                  
                  {expandedIngredients[meal.id] && (
                    <div className="mt-2 p-2 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100 animate-fade-in">
                      {loadingIngredients[meal.id] ? (
                        <div className="text-xs text-muted-foreground">Loading...</div>
                      ) : mealIngredients[meal.id] && mealIngredients[meal.id].length > 0 ? (
                        <div className="text-xs text-green-800">
                          <span className="font-medium text-xs uppercase tracking-wide text-green-600 block mb-1">Ingredients:</span>
                          {mealIngredients[meal.id].map((ingredient, index) => (
                            <span key={ingredient.id}>
                              {ingredient.quantity}{ingredient.unit} {ingredient.name}
                              {index < mealIngredients[meal.id].length - 1 ? ", " : "."}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No ingredients available</div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{meal.description}</p>
                  
                  {/* Macro Information */}
                  <div className="bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg p-3 mb-3 border border-border/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calories</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-foreground">{Math.round(meal.total_calories)}</span>
                          <span className="text-xs text-muted-foreground">kcal</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Protein</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-foreground">{(meal.total_protein || 0).toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">g</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Carbs</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-foreground">{(meal.total_carbs || 0).toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">g</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fat</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-foreground">{(meal.total_fat || 0).toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Display allergens */}
                  {mealAllergens[meal.id] && mealAllergens[meal.id].length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Allergens:</div>
                      <div className="flex flex-wrap gap-1">
                        {mealAllergens[meal.id].map((allergen) => (
                          <Badge key={allergen.id} className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => dec(meal.id)} disabled={qty === 0}>
                        <Minus size={16} />
                      </Button>
                      <span className="w-6 text-center font-medium">{qty}</span>
                      <Button size="sm" onClick={() => inc(meal.id)} disabled={pkg ? totalSelected >= pkg.meal_count : true}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageSelectionDialog;
