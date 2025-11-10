import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
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

  const handleIngredientsClick = () => {
    if (ingredients.length === 0) {
      fetchIngredients();
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-card border hover:border-primary/20">
      {/* Image section */}
      {meal.image_url && (
        <div className="aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden relative">
          <img 
            src={meal.image_url} 
            alt={meal.name}
            className="w-full h-full object-cover"
          />
          {isNew && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <Badge className="bg-green-500 text-white shadow-md animate-pulse text-xs">
                NEW
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-4 sm:p-6">
        {/* Meal name and description */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg sm:text-xl leading-tight mb-2 text-foreground">{meal.name}</h3>
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 leading-relaxed">{meal.description}</p>
        </div>

        {/* Quick nutrition view - Stack vertically on mobile */}
        {(meal.total_calories >= 0 || meal.total_protein >= 0 || meal.total_carbs >= 0 || meal.total_fat >= 0) && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-x-4 sm:gap-y-1 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-muted-foreground text-xs sm:text-sm">Calories:</span>
                <span className="font-semibold text-foreground text-sm sm:ml-1">{Math.round(meal.total_calories || 0)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-muted-foreground text-xs sm:text-sm">Protein:</span>
                <span className="font-semibold text-foreground text-sm sm:ml-1">{(meal.total_protein || 0).toFixed(1)}g</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-muted-foreground text-xs sm:text-sm">Carbs:</span>
                <span className="font-semibold text-foreground text-sm sm:ml-1">{(meal.total_carbs || 0).toFixed(1)}g</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-muted-foreground text-xs sm:text-sm">Fat:</span>
                <span className="font-semibold text-foreground text-sm sm:ml-1">{(meal.total_fat || 0).toFixed(1)}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Info buttons - Larger touch targets */}
        <div className="mb-4">
          <div className="flex flex-col gap-3">
            {/* Ingredients dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={handleIngredientsClick}
                  className="w-full min-h-[44px] bg-muted/50 border-muted-foreground/20 text-foreground hover:bg-muted text-sm font-medium rounded-lg flex items-center justify-center touch-manipulation"
                >
                  <Info className="w-4 h-4 mr-2" />
                  INGREDIENTS
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Ingredients</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  {loadingIngredients ? (
                    <div className="text-gray-500">Loading ingredients...</div>
                  ) : ingredients.length > 0 ? (
                    <div className="text-gray-700 leading-relaxed">
                      {ingredients.map((ingredient, index) => (
                        <span key={ingredient.id}>
                          <span className="font-medium">{ingredient.quantity}{ingredient.unit}</span> {ingredient.name}
                          {index < ingredients.length - 1 ? ", " : "."}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">No ingredients available</div>
                  )}

                  {allergens.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <h5 className="font-semibold text-sm text-red-700 mb-1">Allergens</h5>
                      <div className="flex flex-wrap gap-1">
                        {allergens.map((allergen) => (
                          <Badge key={allergen.id} variant="destructive" className="text-xs">
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Nutrition dialog */}
            {showNutrition && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="w-full min-h-[44px] bg-muted/50 border-muted-foreground/20 text-foreground hover:bg-muted text-sm font-medium rounded-lg flex items-center justify-center touch-manipulation"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    NUTRITION
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Nutrition</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base sm:text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Calories</span>
                      <span className="font-semibold">{Math.round(meal.total_calories)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Protein</span>
                      <span className="font-semibold">{(meal.total_protein || 0).toFixed(1)}g</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Fat</span>
                      <span className="font-semibold">{(meal.total_fat || 0).toFixed(1)}g</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Sat. Fat</span>
                      <span className="font-semibold">{(meal.total_saturated_fat || 0).toFixed(1)}g</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Carbs</span>
                      <span className="font-semibold">{(meal.total_carbs || 0).toFixed(1)}g</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Sugar</span>
                      <span className="font-semibold">{(meal.total_sugar || 0).toFixed(1)}g</span>
                    </div>
                    {meal.total_fiber > 0 && (
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Fiber</span>
                        <span className="font-semibold">{(meal.total_fiber || 0).toFixed(1)}g</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Salt</span>
                      <span className="font-semibold">{(meal.total_salt || 0).toFixed(1)}g</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Price and Add to cart button */}
        {onAddToCart && (
          <div className="space-mobile-sm">
            <div className="text-center">
              <span className="text-heading-md font-bold text-primary">£{meal.price.toFixed(2)}</span>
            </div>
            <Button 
              onClick={() => onAddToCart(meal)}
              size="lg"
              className="w-full min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-text-mobile rounded-lg touch-manipulation"
            >
              Add to Cart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MealCard;