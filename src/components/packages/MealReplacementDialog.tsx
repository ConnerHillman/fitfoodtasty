import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2, ShoppingCart, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
}

const MealReplacementDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealAllergens, setMealAllergens] = useState<Record<string, Allergen[]>>({});
  const [mealIngredients, setMealIngredients] = useState<Record<string, Ingredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState<Record<string, boolean>>({});
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  
  // Calculate progress
  const { toast } = useToast();
  const { reorderData, addPackageToCart } = useCart();
  
  const totalUnavailable = reorderData?.unavailableMeals?.length || 0;
  const replacedCount = Object.keys(replacements).length;
  const progressPercentage = totalUnavailable > 0 ? (replacedCount / totalUnavailable) * 100 : 0;

  const MOBILE_BAR_HEIGHT = 96;

  const filteredMeals = useMemo(
    () => meals.filter(meal => 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [meals, searchTerm]
  );

  const totalReplacements = reorderData?.unavailableMeals.length || 0;
  const currentReplacements = Object.keys(replacements).length;
  const allReplacementsMade = currentReplacements === totalReplacements;

  useEffect(() => {
    if (open && reorderData) {
      setReplacements({});
      setSearchTerm("");
      fetchMeals();
    }
  }, [open, reorderData]);

  const fetchMeals = async () => {
    setLoading(true);
    
    try {
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
    } catch (error) {
      console.error("Error fetching meals:", error);
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

  const handleReplacement = (unavailableMealId: string, replacementMealId: string) => {
    setReplacements(prev => ({
      ...prev,
      [unavailableMealId]: replacementMealId
    }));
  };

  const removeReplacement = (unavailableMealId: string) => {
    setReplacements(prev => {
      const { [unavailableMealId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleCompleteReorder = () => {
    if (!reorderData || !allReplacementsMade) return;

    // Create the new package cart item with replacements
    const selectedMeals: Record<string, number> = {};
    
    // Add replacements
    reorderData.unavailableMeals.forEach(unavailable => {
      const replacementMealId = replacements[unavailable.mealId];
      if (replacementMealId) {
        selectedMeals[replacementMealId] = unavailable.quantity;
      }
    });

    const packageCartItem = {
      id: `reorder-${reorderData.originalOrderId}-${Date.now()}`,
      name: `${reorderData.packageData.name} (Reorder)`,
      description: `Reorder with ${currentReplacements} replacement${currentReplacements > 1 ? 's' : ''}`,
      category: 'package',
      price: reorderData.packageData.price,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      shelf_life_days: 5,
      image_url: reorderData.packageData.image_url,
      packageData: {
        packageId: reorderData.packageData.id,
        packageName: reorderData.packageData.name,
        mealCount: reorderData.packageData.meal_count,
        selectedMeals,
      },
    };

    addPackageToCart(packageCartItem);
    toast({ 
      title: "Reorder Added to Cart!", 
      description: `${reorderData.packageData.name} with replacements added to cart.`,
      variant: "success" as any,
    });
    onOpenChange(false);
  };

  const handleCheckout = () => {
    handleCompleteReorder();
    navigate('/cart');
  };

  if (!reorderData) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[95vh] overflow-y-auto pointer-events-auto md:pb-0"
          style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${MOBILE_BAR_HEIGHT}px)` }}
        >
          <DialogHeader className="mb-6 sm:mb-8">
            <DialogTitle className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent animate-fade-in tracking-tight leading-tight">
              Choose Replacement Meals
            </DialogTitle>
            <p className="text-center text-muted-foreground mt-2">
              Some meals from your previous order are no longer available. Please choose replacements.
            </p>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search replacement meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Unavailable meals needing replacement */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-3">Meals needing replacement:</h3>
            <div className="space-y-2">
              {reorderData.unavailableMeals.map((unavailable) => (
                <div key={unavailable.mealId} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm">{unavailable.mealName} × {unavailable.quantity}</span>
                  {replacements[unavailable.mealId] ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Replaced</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeReplacement(unavailable.mealId)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary">Choose replacement</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar and Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                Replacements: <span className="font-semibold text-foreground">{currentReplacements}</span> / {totalReplacements}
              </div>
              <div className="text-sm">
                {allReplacementsMade ? (
                  <div className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Ready to add
                  </div>
                ) : (
                  <div className="text-muted-foreground">Pick {totalReplacements - currentReplacements} more</div>
                )}
              </div>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-green-100"
              style={{
                background: 'linear-gradient(to right, #16a34a 0%, #16a34a 100%)'
              }}
            />
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex sm:items-center sm:justify-end gap-2 mb-4">
            <Button 
              variant="outline" 
              onClick={handleCompleteReorder} 
              disabled={!allReplacementsMade}
              className="flex items-center gap-2 h-12 min-w-[120px] touch-manipulation"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </Button>
            <Button 
              onClick={handleCheckout} 
              disabled={!allReplacementsMade}
              className="bg-green-500 hover:bg-green-600 h-12 min-w-[140px] touch-manipulation"
            >
              Proceed to Checkout
            </Button>
          </div>

          {/* Meals grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-40" />
            ))}
            {!loading && filteredMeals.length === 0 && searchTerm && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No meals found matching "{searchTerm}"
              </div>
            )}
            {!loading && filteredMeals.map((meal) => (
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
                    className="mt-2 mx-auto w-fit h-8 sm:h-6 px-3 sm:px-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:text-green-800 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"
                  >
                    {expandedIngredients[meal.id] ? <ChevronUp size={12} className="sm:w-[10px] sm:h-[10px]" /> : <ChevronDown size={12} className="sm:w-[10px] sm:h-[10px]" />}
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
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{meal.description}</p>
                  
                  {/* Macro Information */}
                  <div className="bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg p-3 mb-3 border border-border/50">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  
                  <div className="flex items-center justify-center">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        // Find which unavailable meal this should replace
                        const unassignedUnavailable = reorderData.unavailableMeals.find(
                          unavailable => !replacements[unavailable.mealId]
                        );
                        if (unassignedUnavailable) {
                          handleReplacement(unassignedUnavailable.mealId, meal.id);
                        }
                      }}
                      disabled={!reorderData.unavailableMeals.find(unavailable => !replacements[unavailable.mealId])}
                      className="h-10 w-full touch-manipulation"
                    >
                      Select as Replacement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Persistent Counter */}
      <div className={`md:hidden fixed inset-x-0 bottom-0 z-[100] min-h-[96px] transition-all duration-500 ease-out ${open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="pointer-events-none bg-gradient-to-t from-background via-background/95 to-transparent pt-3 pb-safe">
          <div className="mx-4 mb-4 pointer-events-auto">
            <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl p-4 animate-fade-in">
              <div className="w-full bg-muted/60 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${Math.min((currentReplacements / totalReplacements) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold text-foreground tracking-tight">
                      {currentReplacements}
                    </div>
                    <div className="text-muted-foreground text-lg font-medium">
                      /{totalReplacements}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {allReplacementsMade ? (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                        <CheckCircle2 size={16} className="animate-scale-in" />
                        Ready!
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        {totalReplacements - currentReplacements} left
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCompleteReorder}
                    disabled={!allReplacementsMade}
                    className="h-12 min-w-[90px] touch-manipulation text-sm font-medium transition-all duration-300 hover:scale-105 disabled:hover:scale-100 border-border/60 bg-background/80"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCheckout}
                    disabled={!allReplacementsMade}
                    className="h-12 min-w-[100px] touch-manipulation text-sm font-medium transition-all duration-300 hover:scale-105 disabled:hover:scale-100 bg-gradient-to-r from-primary to-primary/90 shadow-md"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      {open && (
        <div 
          className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-50 p-4"
          style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1rem)` }}
        >
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCompleteReorder} 
              disabled={!allReplacementsMade}
              className="flex-1 h-12 touch-manipulation"
            >
              <ShoppingCart size={16} className="mr-2" />
              Add to Cart
            </Button>
            <Button 
              onClick={handleCheckout} 
              disabled={!allReplacementsMade}
              className="flex-1 bg-green-500 hover:bg-green-600 h-12 touch-manipulation"
            >
              Checkout
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default MealReplacementDialog;