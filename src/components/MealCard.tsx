import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
      console.error("Error fetching ingredients:", error);
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
    <Card className="h-full hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-white border border-gray-200 hover:border-emerald-300">
      {/* Image section */}
      {meal.image_url && (
        <div className="aspect-[4/3] w-full overflow-hidden relative">
          <img 
            src={meal.image_url} 
            alt={meal.name}
            className="w-full h-full object-cover"
          />
          {isNew && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 text-white shadow-md animate-pulse">
                NEW
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-3">
        {/* Meal name and description */}
        <div className="mb-3">
          <h3 className="font-bold text-base leading-tight mb-1">{meal.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{meal.description}</p>
        </div>

        {/* Info buttons */}
        <div className="mb-3">
          {isMobile ? (
            <div className="flex flex-col items-center gap-2">
              {/* Ingredients dialog (mobile) */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleIngredientsClick}
                    className="w-full h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-medium rounded-lg flex items-center justify-center"
                  >
                    <Info className="w-3 h-3 mr-1" />
                    INGREDIENTS
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base">Ingredients</DialogTitle>
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

              {/* Nutrition dialog (mobile) */}
              {showNutrition && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-medium rounded-lg flex items-center justify-center"
                    >
                      <Info className="w-3 h-3 mr-1" />
                      NUTRITION
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-base">Nutrition</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 text-sm">
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
          ) : (
            <>
              {/* Ingredients popover (desktop) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleIngredientsClick}
                    className="flex-1 h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg flex items-center justify-center"
                  >
                    <Info className="w-3 h-3 mr-1" />
                    INGREDIENTS
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-900">Ingredients</h4>
                    {loadingIngredients ? (
                      <div className="text-sm text-gray-500">Loading ingredients...</div>
                    ) : ingredients.length > 0 ? (
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {ingredients.map((ingredient, index) => (
                          <span key={ingredient.id}>
                            <span className="font-medium">{ingredient.quantity}{ingredient.unit}</span> {ingredient.name}
                            {index < ingredients.length - 1 ? ", " : "."}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No ingredients available</div>
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
                </PopoverContent>
              </Popover>

              {/* Nutrition popover (desktop) */}
              {showNutrition && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg flex items-center justify-center"
                    >
                      <Info className="w-3 h-3 mr-1" />
                      NUTRITION
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-900">Nutrition Facts</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
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
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
        </div>

        {/* Price and Add to cart button */}
        {onAddToCart && (
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-lg font-bold text-emerald-600">£{meal.price.toFixed(2)}</span>
            </div>
            <Button 
              onClick={() => onAddToCart(meal)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg"
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