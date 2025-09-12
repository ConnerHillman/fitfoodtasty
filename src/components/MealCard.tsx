import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNutritionFacts, setShowNutritionFacts] = useState(false);

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

  const handleIngredientsToggle = () => {
    if (!showIngredients && ingredients.length === 0) {
      fetchIngredients();
    }
    setShowIngredients(!showIngredients);
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
          {/* Price badge */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-emerald-600 text-white font-bold text-sm px-2 py-1 shadow-lg rounded-full">
              £{meal.price.toFixed(2)}
            </Badge>
          </div>
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

        {/* Collapsible buttons */}
        <div className="space-y-2 mb-3">
          {/* Ingredients button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleIngredientsToggle}
            className="w-full h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center">
              <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showIngredients ? 'rotate-180' : ''}`} />
              INGREDIENTS
            </div>
          </Button>
          
          {/* Nutrition Facts button */}
          {showNutrition && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowNutritionFacts(!showNutritionFacts)}
              className="w-full h-8 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-medium rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center">
                <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showNutritionFacts ? 'rotate-180' : ''}`} />
                NUTRITION FACTS
              </div>
            </Button>
          )}
        </div>

        {/* Collapsible content */}
        {showIngredients && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg border animate-fade-in">
            {loadingIngredients ? (
              <div className="text-xs text-gray-500">Loading ingredients...</div>
            ) : ingredients.length > 0 ? (
              <div className="text-xs text-gray-700">
                {ingredients.map((ingredient, index) => (
                  <span key={ingredient.id}>
                    {ingredient.quantity}{ingredient.unit} {ingredient.name}
                    {index < ingredients.length - 1 ? ", " : "."}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No ingredients available</div>
            )}
            
            {allergens.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs font-medium text-red-600">Contains: {allergens.map(a => a.name).join(', ')}</div>
              </div>
            )}
          </div>
        )}

        {showNutritionFacts && showNutrition && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg border animate-fade-in">
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex justify-between">
                <span>Calories</span>
                <span className="font-medium">{Math.round(meal.total_calories)}</span>
              </div>
              <div className="flex justify-between">
                <span>Protein</span>
                <span className="font-medium">{(meal.total_protein || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat</span>
                <span className="font-medium">{(meal.total_fat || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Saturated Fat</span>
                <span className="font-medium">{(meal.total_saturated_fat || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbs</span>
                <span className="font-medium">{(meal.total_carbs || 0).toFixed(1)}g</span>
              </div>
              <div className="flex justify-between">
                <span>Sugar</span>
                <span className="font-medium">{(meal.total_sugar || 0).toFixed(1)}g</span>
              </div>
              {meal.total_fiber > 0 && (
                <div className="flex justify-between">
                  <span>Fiber</span>
                  <span className="font-medium">{(meal.total_fiber || 0).toFixed(1)}g</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Salt</span>
                <span className="font-medium">{(meal.total_salt || 0).toFixed(1)}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Add to cart button */}
        {onAddToCart && (
          <Button 
            onClick={() => onAddToCart(meal)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg"
          >
            Add to Cart
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MealCard;