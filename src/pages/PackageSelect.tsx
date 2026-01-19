import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, CheckCircle2, ShoppingCart, Search, Check, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import AppLayout from "@/components/AppLayout";

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

interface MealPackage {
  id: string;
  name: string;
  description?: string | null;
  meal_count: number;
  price: number;
  image_url?: string | null;
}

const PackageSelect = () => {
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId: string }>();
  const [pkg, setPkg] = useState<MealPackage | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [mealAllergens, setMealAllergens] = useState<Record<string, Allergen[]>>({});
  const [mealIngredients, setMealIngredients] = useState<Record<string, Ingredient[]>>({});
  const [loadingIngredients, setLoadingIngredients] = useState<Record<string, boolean>>({});
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!packageId) {
      navigate('/packages');
      return;
    }

    (async () => {
      setLoading(true);
      
      // Fetch the package details
      const { data: pkgData, error: pkgError } = await supabase
        .from("packages")
        .select("id,name,description,meal_count,price,image_url")
        .eq("id", packageId)
        .eq("is_active", true)
        .single();
        
      if (pkgError || !pkgData) {
        toast({ title: "Package not found", variant: "destructive" });
        navigate('/packages');
        return;
      }
      
      setPkg(pkgData as MealPackage);
      
      // Fetch meals for this package
      const { data: packageMealData, error: packageError } = await supabase
        .from("package_meals")
        .select("meal_id")
        .eq("package_id", packageId);
        
      if (packageError) {
        console.error("Error fetching package meals:", packageError);
        setLoading(false);
        return;
      }
      
      if (!packageMealData || packageMealData.length === 0) {
        // No specific meals assigned - show all active meals
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
        // Fetch specific meals for this package
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
      
      setLoading(false);
    })();
  }, [packageId, navigate, toast]);

  const handleViewDetails = (mealId: string) => {
    if (expandedMealId === mealId) {
      setExpandedMealId(null);
    } else {
      setExpandedMealId(mealId);
      if (!mealIngredients[mealId]) {
        fetchIngredientsForMeal(mealId);
      }
    }
  };

  const inc = (id: string) => {
    if (!pkg) return;
    setSelected((prev) => {
      const current = prev[id] || 0;
      const nextTotal = totalSelected + 1;
      if (nextTotal > pkg.meal_count) return prev;
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

    const packageCartItem = {
      id: `package-${pkg.id}-${Date.now()}`,
      name: `${pkg.name}`,
      description: summary,
      category: 'package',
      price: pkg.price,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      shelf_life_days: 5,
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
      title: "Added to Cart!", 
      description: `${pkg.name} with ${totalSelected} meals added to cart.`,
      variant: "success" as any,
    });
    navigate('/cart');
  };

  const handleBack = () => {
    navigate('/packages');
  };

  const isComplete = pkg ? totalSelected === pkg.meal_count : false;
  const remaining = pkg ? pkg.meal_count - totalSelected : 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-32 md:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            {/* Back button and title */}
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-9 px-2 rounded-lg hover:bg-muted"
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Choose your meals
                </h1>
                <p className="text-sm text-muted-foreground">
                  {pkg ? `Select ${pkg.meal_count} meals to complete your ${pkg.name}` : 'Loading...'}
                </p>
              </div>
            </div>

            {/* Progress indicator - Desktop */}
            <div className="hidden md:flex items-center justify-between gap-4">
              {/* Progress bar */}
              <div className="flex-1 max-w-md">
                <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pkg ? Math.min((totalSelected / pkg.meal_count) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
              
              {/* Status text */}
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{totalSelected}</span>
                  <span className="text-muted-foreground"> / {pkg?.meal_count ?? 0} meals selected</span>
                </div>
                {isComplete ? (
                  <div className="text-primary flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle2 size={16} /> Ready to continue
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Pick {remaining} more</div>
                )}
              </div>

              {/* Desktop CTA buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleAddToCart} 
                  disabled={!isComplete}
                  className="flex items-center gap-2 h-10 touch-manipulation rounded-xl"
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </Button>
                <Button 
                  onClick={handleAddToCart} 
                  disabled={!isComplete}
                  className="h-10 min-w-[120px] touch-manipulation rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base rounded-xl border-border/60"
              />
            </div>
          </div>
        </div>

        {/* Meals grid */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {loading && Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-muted animate-pulse" />
            ))}
            {!loading && filteredMeals.length === 0 && searchTerm && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No meals found matching "{searchTerm}"
              </div>
            )}
            {!loading && filteredMeals.map((meal) => {
              const qty = selected[meal.id] || 0;
              const isSelected = qty > 0;
              const isExpanded = expandedMealId === meal.id;
              
              return (
                <div 
                  key={meal.id} 
                  className={`
                    group relative bg-card rounded-2xl overflow-hidden
                    shadow-card hover:shadow-card-hover
                    transition-all duration-300 ease-out
                    ${isSelected 
                      ? 'ring-2 ring-primary/60 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]' 
                      : 'hover:scale-[1.02]'
                    }
                  `}
                >
                  {/* Selection badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-scale-in">
                      {qty > 1 ? (
                        <span className="text-xs font-bold">{qty}</span>
                      ) : (
                        <Check size={14} strokeWidth={3} />
                      )}
                    </div>
                  )}

                  {/* Image section - tappable for details */}
                  <button
                    type="button"
                    onClick={() => handleViewDetails(meal.id)}
                    className="w-full text-left focus:outline-none"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      {meal.image_url ? (
                        <img 
                          src={meal.image_url} 
                          alt={meal.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Content section */}
                  <div className="px-3 pt-2.5 pb-3">
                    {/* Meal name */}
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground mb-1">
                      {meal.name}
                    </h3>
                    
                    {/* Simplified nutrition - calories & protein only */}
                    <p className="text-xs text-muted-foreground mb-2.5">
                      {Math.round(meal.total_calories)} kcal · {Math.round(meal.total_protein)}g protein
                    </p>

                    {/* View Details link - centered */}
                    <button
                      type="button"
                      onClick={() => handleViewDetails(meal.id)}
                      className="w-full text-center mb-2.5"
                    >
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-primary transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        Details
                      </span>
                    </button>

                    {/* Quantity selector - centered */}
                    <div className="flex items-center justify-center gap-2.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => dec(meal.id)} 
                        disabled={qty === 0}
                        className="h-9 w-9 p-0 touch-manipulation rounded-lg border-border/60"
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-7 text-center font-semibold text-base">{qty}</span>
                      <Button 
                        size="sm" 
                        onClick={() => inc(meal.id)} 
                        disabled={pkg ? totalSelected >= pkg.meal_count : true}
                        className="h-9 w-9 p-0 touch-manipulation rounded-lg"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details panel */}
                  {isExpanded && (
                    <div className="px-3 pb-3 animate-fade-in border-t border-border/40 pt-2.5">
                      {/* Description */}
                      {meal.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                          {meal.description}
                        </p>
                      )}
                      
                      {/* Full macro breakdown */}
                      <div className="bg-muted/40 rounded-lg p-2 mb-2">
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Calories</span>
                            <span className="font-medium">{Math.round(meal.total_calories)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protein</span>
                            <span className="font-medium">{meal.total_protein?.toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Carbs</span>
                            <span className="font-medium">{meal.total_carbs?.toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fat</span>
                            <span className="font-medium">{meal.total_fat?.toFixed(1)}g</span>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients */}
                      {loadingIngredients[meal.id] ? (
                        <div className="text-xs text-muted-foreground">Loading ingredients...</div>
                      ) : mealIngredients[meal.id] && mealIngredients[meal.id].length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Ingredients: </span>
                          <span className="text-xs text-foreground/80">
                            {mealIngredients[meal.id].map((ing, i) => (
                              <span key={ing.id}>
                                {ing.name}{i < mealIngredients[meal.id].length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                      
                      {/* Allergens */}
                      {mealAllergens[meal.id] && mealAllergens[meal.id].length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">Allergens</span>
                          <div className="flex flex-wrap gap-1">
                            {mealAllergens[meal.id].map((allergen) => (
                              <Badge 
                                key={allergen.id} 
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                              >
                                {allergen.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50">
          <div className="pointer-events-none bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-safe">
            <div className="mx-4 mb-4 pointer-events-auto">
              <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl p-4">
                {/* Progress bar */}
                <div className="w-full bg-muted/60 rounded-full h-2 mb-3 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pkg ? Math.min((totalSelected / pkg.meal_count) * 100, 100) : 0}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-bold text-foreground tracking-tight">
                        {totalSelected}
                      </span>
                      <span className="text-muted-foreground text-lg font-medium">
                        /{pkg?.meal_count ?? 0}
                      </span>
                    </div>
                    <div>
                      {isComplete ? (
                        <div className="flex items-center gap-1.5 text-primary text-sm font-semibold">
                          <CheckCircle2 size={16} className="animate-scale-in" />
                          Ready!
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          {remaining} left
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!isComplete}
                    className="h-11 min-w-[120px] touch-manipulation text-sm font-medium rounded-xl shadow-md"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PackageSelect;
