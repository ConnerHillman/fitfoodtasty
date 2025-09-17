import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

interface SubscriptionPlan {
  id: string;
  name: string;
  meal_count: number;
  price_per_delivery: number;
  delivery_frequency: string;
  stripe_price_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onProceedToCheckout: (selectedMeals: Record<string, number>) => void;
}

const SubscriptionMealSelectionDialog = ({ open, onOpenChange, plan, onProceedToCheckout }: Props) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealAllergens, setMealAllergens] = useState<Record<string, Allergen[]>>({});
  const [mealIngredients, setMealIngredients] = useState<Record<string, Ingredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState<Record<string, boolean>>({});
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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
    if (open && plan) {
      setSelected({});
      setSearchTerm("");
      fetchMeals();
    }
  }, [open, plan]);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("id,name,description,category,price,image_url,total_calories,total_protein,total_carbs,total_fat,total_fiber")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (!error && data) {
        const mealsData = data as Meal[];
        setMeals(mealsData);
        await fetchAllergensForMeals(mealsData.map(m => m.id));
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast({
        title: "Error",
        description: "Failed to load meals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    if (!plan) return;
    setSelected((prev) => {
      const current = prev[id] || 0;
      const nextTotal = totalSelected + 1;
      if (nextTotal > plan.meal_count) return prev;
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

  const handleProceedToCheckout = () => {
    if (!plan) return;
    if (totalSelected !== plan.meal_count) {
      toast({ 
        title: "Select meals", 
        description: `Please select exactly ${plan.meal_count} meals.`, 
        variant: "destructive" 
      });
      return;
    }

    onProceedToCheckout(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-center text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent">
            Choose {plan?.meal_count} meals for your subscription
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            {plan?.name} - £{plan?.price_per_delivery}/{plan?.delivery_frequency}
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Selection status */}
        <div className="flex items-center justify-between gap-4 mb-4 mt-2">
          <div className="text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{totalSelected}</span> / {plan?.meal_count ?? 0}
          </div>
          <div className="flex items-center gap-2">
            {totalSelected === (plan?.meal_count ?? 0) ? (
              <div className="text-green-600 flex items-center gap-1 text-sm">
                <CheckCircle2 size={16} /> Ready to proceed
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Pick {((plan?.meal_count ?? 0) - totalSelected)} more</div>
            )}
            <Button 
              onClick={handleProceedToCheckout} 
              disabled={!plan || totalSelected !== (plan?.meal_count ?? 0)}
              className="h-12 min-w-[140px]"
            >
              {totalSelected === (plan?.meal_count ?? 0) ? (
                "Proceed to Checkout"
              ) : (
                `Select ${(plan?.meal_count ?? 0) - totalSelected} more`
              )}
            </Button>
          </div>
        </div>

        {/* Meals grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40">
              <CardContent className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
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
                  <CardTitle className="text-base sm:text-lg">{meal.name}</CardTitle>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleIngredientsToggle(meal.id)}
                    className="mt-2 mx-auto w-fit h-8 px-3 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100"
                  >
                    {expandedIngredients[meal.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    <span className="ml-1 text-xs font-medium">INGREDIENTS</span>
                  </Button>
                  
                  {expandedIngredients[meal.id] && (
                    <div className="mt-2 p-2 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
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
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{meal.description}</p>
                  
                  {/* Macro Information */}
                  <div className="bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg p-3 mb-3 border border-border/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Calories</span>
                        <span className="text-sm font-bold">{Math.round(meal.total_calories)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Protein</span>
                        <span className="text-sm font-bold">{(meal.total_protein || 0).toFixed(1)}g</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Carbs</span>
                        <span className="text-sm font-bold">{(meal.total_carbs || 0).toFixed(1)}g</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Fat</span>
                        <span className="text-sm font-bold">{(meal.total_fat || 0).toFixed(1)}g</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Display allergens */}
                  {mealAllergens[meal.id] && mealAllergens[meal.id].length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Allergens:</div>
                      <div className="flex flex-wrap gap-1">
                        {mealAllergens[meal.id].map((allergen) => (
                          <Badge key={allergen.id} variant="secondary" className="text-xs px-2 py-0">
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-medium">£{meal.price}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dec(meal.id)}
                        disabled={qty === 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center font-medium">{qty}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => inc(meal.id)}
                        disabled={totalSelected >= (plan?.meal_count ?? 0)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus size={14} />
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

export default SubscriptionMealSelectionDialog;