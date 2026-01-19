import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";


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
  allergens?: Allergen[];
}

interface MealCardProps {
  meal: Meal;
  onAddToCart?: (meal: Meal) => void;
  showNutrition?: boolean;
  showPrintButton?: boolean;
  showCategoryTag?: boolean;
  isNew?: boolean;
}

const MealCard = ({ meal, onAddToCart, showNutrition = true, isNew = false }: MealCardProps) => {
  const { toast } = useToast();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchMealAllergens();
  }, [meal.id]);

  const fetchMealAllergens = async () => {
    const { data, error } = await supabase
      .from("meal_allergens")
      .select(`
        allergens (
          id,
          name,
          description
        )
      `)
      .eq("meal_id", meal.id);

    if (!error && data) {
      setAllergens(data.map((ma: any) => ma.allergens).filter(Boolean));
    }
  };

  const fetchIngredients = async () => {
    if (ingredients.length > 0 || loadingIngredients) return;
    
    setLoadingIngredients(true);
    
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
        .eq("meal_id", meal.id);

      if (!error && data) {
        const ingredientsList: Ingredient[] = data.map((mi: any) => ({
          id: mi.ingredients.id,
          name: mi.ingredients.name,
          quantity: mi.quantity,
          unit: mi.unit || 'g'
        }));
        setIngredients(ingredientsList);
      }
    } catch (error) {
      logger.dbError('fetch', 'meal_ingredients', error, { meal_id: meal.id });
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleDetailsOpen = (open: boolean) => {
    setDetailsOpen(open);
    if (open && ingredients.length === 0) {
      fetchIngredients();
    }
  };

  return (
    <Dialog open={detailsOpen} onOpenChange={handleDetailsOpen}>
      <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ease-out group">
        {/* Tappable area for opening details */}
        <DialogTrigger asChild>
          <button className="flex flex-col flex-1 text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-t-2xl">
            {/* Full-width image with rounded top only */}
            {meal.image_url && (
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img 
                  src={meal.image_url} 
                  alt={meal.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
                {isNew && (
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-primary/90 text-primary-foreground shadow-sm text-[9px] font-semibold px-1.5 py-0.5 uppercase tracking-wide">
                      New
                    </Badge>
                  </div>
                )}
              </div>
            )}
            
            {/* Content section */}
            <div className="flex flex-col flex-1 w-full px-3 pt-2.5 pb-2">
              {/* Meal name - max 2 lines */}
              <h3 className="font-semibold text-sm leading-tight text-foreground tracking-tight line-clamp-2">
                {meal.name}
              </h3>

              {/* Compact nutrition summary - Calories & Protein only */}
              <p className="text-[11px] text-muted-foreground mt-1">
                {Math.round(meal.total_calories || 0)} kcal · {Math.round(meal.total_protein || 0)}g protein
              </p>
              
              {/* View Details - tertiary, positioned between nutrition and price */}
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-primary transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  View Details
                </span>
              </div>
            </div>
          </button>
        </DialogTrigger>

        {/* Decision block: Price + CTA grouped as one unit */}
        <div className="px-3 pb-3 pt-0">
          {/* Price - prominent but secondary to CTA */}
          <div className="mb-2">
            <span className="text-lg font-bold text-foreground tracking-tight">
              £{meal.price.toFixed(2)}
            </span>
          </div>

          {/* Add to Cart button - primary CTA */}
          {onAddToCart && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(meal);
              }}
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99] touch-manipulation shadow-button hover:shadow-button-hover text-sm h-11"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>

      {/* Details Dialog Content */}
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold pr-6">{meal.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Description */}
          {meal.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {meal.description}
            </p>
          )}

          {/* Full Nutrition Table */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Nutrition</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calories</span>
                <span className="font-medium">{Math.round(meal.total_calories || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protein</span>
                <span className="font-medium">{(meal.total_protein || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carbs</span>
                <span className="font-medium">{(meal.total_carbs || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fat</span>
                <span className="font-medium">{(meal.total_fat || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sat. Fat</span>
                <span className="font-medium">{(meal.total_saturated_fat || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sugar</span>
                <span className="font-medium">{(meal.total_sugar || 0).toFixed(1)}g</span>
              </div>
              {meal.total_fiber > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fiber</span>
                  <span className="font-medium">{(meal.total_fiber || 0).toFixed(1)}g</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salt</span>
                <span className="font-medium">{(meal.total_salt || 0).toFixed(1)}g</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Ingredients</h4>
            {loadingIngredients ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : ingredients.length > 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ingredients.map((ingredient, index) => (
                  <span key={ingredient.id}>
                    {ingredient.name}
                    {index < ingredients.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No ingredients listed</p>
            )}
          </div>

          {/* Allergens */}
          {allergens.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-destructive">Allergens</h4>
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((allergen) => (
                  <Badge key={allergen.id} variant="destructive" className="text-xs">
                    {allergen.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Price in dialog */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">£{meal.price.toFixed(2)}</span>
              {onAddToCart && (
                <Button 
                  onClick={() => {
                    onAddToCart(meal);
                    setDetailsOpen(false);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
                >
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealCard;
