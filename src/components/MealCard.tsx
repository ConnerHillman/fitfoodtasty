import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import CategoryTag from "./CategoryTag";

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
  total_fiber: number;
  total_weight?: number;
  image_url?: string;
  allergens?: Allergen[];
}

interface MealCardProps {
  meal: Meal;
  onAddToCart?: (meal: Meal) => void;
  showNutrition?: boolean;
  showPrintButton?: boolean;
  isNew?: boolean;
}

const MealCard = ({ meal, onAddToCart, showNutrition = true, showPrintButton = false, isNew = false }: MealCardProps) => {
  const { toast } = useToast();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

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


  const printMealLabel = async () => {
    try {
      // Fetch logo and convert to base64 in main window context
      let logoBase64 = '';
      try {
        const logoResponse = await fetch('/lovable-uploads/10536b16-bcbb-425b-ad58-6c366dfcc3a9.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
        }
      } catch (logoError) {
        console.log("Logo fetch failed, using text fallback");
      }

      // Fetch ingredients for this meal
      const { data: mealIngredients, error } = await supabase
        .from("meal_ingredients")
        .select(`
          quantity,
          unit,
          ingredients (
            name,
            description
          )
        `)
        .eq("meal_id", meal.id);

      if (error) {
        console.error("Error fetching ingredients:", error);
        toast({
          title: "Error",
          description: "Failed to load ingredients for label",
          variant: "destructive",
        });
        return;
      }

      // Sort ingredients by weight (quantity) in descending order as per UK rules
      const sortedIngredients = (mealIngredients || [])
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .map(mi => mi.ingredients?.name || 'Unknown ingredient');

      // Common allergens mapping
      const allergenKeywords = {
        'gluten': ['wheat', 'barley', 'rye', 'oats'],
        'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt'],
        'eggs': ['egg', 'eggs'],
        'nuts': ['almond', 'walnut', 'pecan', 'hazelnut', 'cashew', 'pistachio'],
        'peanuts': ['peanut', 'groundnut'],
        'soy': ['soy', 'soya', 'tofu'],
        'fish': ['fish', 'salmon', 'tuna', 'cod', 'haddock'],
        'shellfish': ['prawn', 'shrimp', 'crab', 'lobster', 'mussel'],
        'sesame': ['sesame', 'tahini']
      };

      // Detect allergens in ingredients
      const detectedAllergens: string[] = [];
      const ingredientText = sortedIngredients.join(' ').toLowerCase();
      
      Object.entries(allergenKeywords).forEach(([allergen, keywords]) => {
        if (keywords.some(keyword => ingredientText.includes(keyword))) {
          detectedAllergens.push(allergen.charAt(0).toUpperCase() + allergen.slice(1));
        }
      });

      // Calculate expiry date (3 days from now for fresh meals)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);

      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast({
          title: "Print Blocked",
          description: "Please allow popups to print meal labels.",
          variant: "destructive",
        });
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Meal Label - ${meal.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              font-size: 12px;
              line-height: 1.4;
            }
            .label { 
              border: 2px solid #000; 
              padding: 15px; 
              max-width: 400px;
              margin: 0 auto;
              background: white;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 15px;
            }
            .meal-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-name {
              font-size: 14px;
              color: #2563eb;
              font-weight: bold;
            }
            .section {
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #ccc;
            }
            .section:last-child {
              border-bottom: none;
            }
            .section-title {
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              margin-bottom: 5px;
            }
            .nutrition-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 3px;
              font-size: 11px;
            }
            .nutrition-item {
              display: flex;
              justify-content: space-between;
            }
            .ingredients-list {
              font-size: 11px;
              text-align: justify;
            }
            .allergens {
              font-weight: bold;
              color: #dc2626;
              font-size: 11px;
            }
            .expiry {
              font-weight: bold;
              font-size: 13px;
              text-align: center;
              background: #fef3c7;
              padding: 5px;
              border: 1px solid #f59e0b;
              margin-top: 10px;
            }
            .weight {
              text-align: center;
              font-size: 11px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .label { 
                margin: 0;
                border: 2px solid #000;
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">
              <div class="meal-name">${meal.name}</div>
              ${logoBase64 ? `
                <div style="display: flex; align-items: center; justify-content: center; margin-top: 5px;">
                  <img src="${logoBase64}" alt="Fit Food Tasty" style="height: 24px; width: auto;" />
                </div>
              ` : `
                <div class="company-name">Fit Food Tasty</div>
              `}
            </div>

            <div class="section">
              <div class="section-title">Nutritional Information (per portion)</div>
              <div class="nutrition-grid">
                <div class="nutrition-item">
                  <span>Energy:</span>
                  <span><strong>${Math.round(meal.total_calories)} kcal</strong></span>
                </div>
                <div class="nutrition-item">
                  <span>Protein:</span>
                  <span><strong>${(meal.total_protein || 0).toFixed(1)}g</strong></span>
                </div>
                <div class="nutrition-item">
                  <span>Carbohydrates:</span>
                  <span><strong>${(meal.total_carbs || 0).toFixed(1)}g</strong></span>
                </div>
                <div class="nutrition-item">
                  <span>Fat:</span>
                  <span><strong>${(meal.total_fat || 0).toFixed(1)}g</strong></span>
                </div>
                ${meal.total_fiber > 0 ? `
                <div class="nutrition-item">
                  <span>Fibre:</span>
                  <span><strong>${(meal.total_fiber || 0).toFixed(1)}g</strong></span>
                </div>
                ` : ''}
              </div>
              <div class="weight">Approx weight: ${(meal.total_weight || 0).toFixed(0)}g</div>
            </div>

            <div class="section">
              <div class="section-title">Ingredients</div>
              <div class="ingredients-list">
                ${sortedIngredients.length > 0 
                  ? sortedIngredients.join(', ') + '.'
                  : 'Ingredients list not available.'}
              </div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">
                Listed in descending order of weight.
              </div>
            </div>

            ${detectedAllergens.length > 0 ? `
            <div class="section">
              <div class="section-title">Allergens</div>
              <div class="allergens">
                Contains: ${detectedAllergens.join(', ')}
              </div>
              <div style="font-size: 10px; color: #666; margin-top: 3px;">
                May contain traces of other allergens due to cross-contamination.
              </div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Storage Instructions</div>
              <div style="font-size: 11px;">
                Keep refrigerated at 0-5°C. Once opened, consume immediately. Do not freeze.
              </div>
            </div>

            <div class="expiry">
              USE BY: ${expiryDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </div>

            <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
              Prepared fresh by Fit Food Tasty<br>
              Unit F, Cartwright Mill Business Centre, Brue Avenue, Bridgwater
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      toast({
        title: "Printing Label",
        description: `Generated food label for ${meal.name}`,
      });

    } catch (error) {
      console.error("Error printing meal label:", error);
      toast({
        title: "Error",
        description: "Failed to generate meal label",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full hover:shadow-2xl transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 border-2 border-green-100/50 hover:border-green-200 hover:scale-105 transform backdrop-blur-sm">
      {/* Premium glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      {isNew && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-green-500 text-white shadow-md animate-pulse">
            NEW
          </Badge>
        </div>
      )}
       {meal.image_url && (
         <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg relative">
           <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent z-10"></div>
           <img 
             src={meal.image_url} 
             alt={meal.name}
             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
           />
         </div>
       )}
      
       <CardHeader className="pb-2 text-center relative z-20">
         <div className="flex items-center justify-between mb-3">
           <CategoryTag category={meal.category} size="sm" variant="bold" />
           <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg px-3 py-1 shadow-lg">
             £{meal.price.toFixed(2)}
           </Badge>
         </div>
         <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">{meal.name}</CardTitle>
         <CardDescription className="mt-1 text-sm text-gray-600 leading-relaxed">
           {meal.description}
         </CardDescription>
         
         <Button 
           variant="outline" 
           size="sm" 
           onClick={handleIngredientsToggle}
           className="mt-2 mx-auto w-fit px-3 py-1 h-7 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/70 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:text-green-800 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium tracking-wide rounded-full"
         >
           {showIngredients ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
           <span className="ml-1">INGREDIENTS</span>
         </Button>
        
        {showIngredients && (
          <div className="mt-3 p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100 animate-fade-in">
            {loadingIngredients ? (
              <div className="text-sm text-muted-foreground">Loading ingredients...</div>
            ) : ingredients.length > 0 ? (
              <div className="text-sm text-green-800">
                <span className="font-medium text-xs uppercase tracking-wide text-green-600 block mb-1">Ingredients:</span>
                {ingredients.map((ingredient, index) => (
                  <span key={ingredient.id}>
                    {ingredient.quantity}{ingredient.unit} {ingredient.name}
                    {index < ingredients.length - 1 ? ", " : "."}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No ingredients available</div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 relative z-20 px-4 pb-4">
        {showNutrition && (
          <>
            <div className="bg-gradient-to-r from-green-50/70 via-emerald-50/70 to-green-50/70 rounded-xl p-3 border border-green-100/50 backdrop-blur-sm">
              <h4 className="font-bold text-xs mb-2 text-green-800 uppercase tracking-wider">Nutrition Facts</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between bg-white/60 rounded-lg px-2 py-1">
                  <span className="text-gray-600 font-medium">Calories</span>
                  <span className="font-bold text-green-700">{Math.round(meal.total_calories)}</span>
                </div>
                <div className="flex justify-between bg-white/60 rounded-lg px-2 py-1">
                  <span className="text-gray-600 font-medium">Protein</span>
                  <span className="font-bold text-green-700">{meal.total_protein?.toFixed(1) || '0'}g</span>
                </div>
                <div className="flex justify-between bg-white/60 rounded-lg px-2 py-1">
                  <span className="text-gray-600 font-medium">Carbs</span>
                  <span className="font-bold text-green-700">{meal.total_carbs?.toFixed(1) || '0'}g</span>
                </div>
                <div className="flex justify-between bg-white/60 rounded-lg px-2 py-1">
                  <span className="text-gray-600 font-medium">Fat</span>
                  <span className="font-bold text-green-700">{meal.total_fat?.toFixed(1) || '0'}g</span>
                </div>
                {meal.total_fiber > 0 && (
                  <div className="flex justify-between bg-white/60 rounded-lg px-2 py-1 col-span-2">
                    <span className="text-gray-600 font-medium">Fiber</span>
                    <span className="font-bold text-green-700">{meal.total_fiber?.toFixed(1)}g</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Display allergens */}
            {allergens.length > 0 && (
              <div className="rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2">Allergens</h4>
                <div className="flex flex-wrap gap-1">
                  {allergens.map((allergen) => (
                    <Badge key={allergen.id} className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                      {allergen.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Separator />
          </>
        )}

        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
            £{meal.price?.toFixed(2) || '0.00'}
          </div>
          <div className="flex gap-2 w-full justify-center">
            {showPrintButton && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={printMealLabel}
                className="h-8 px-3 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200/70 text-gray-700 hover:from-gray-100 hover:to-slate-100 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md rounded-full"
              >
                <Printer className="h-3 w-3" />
              </Button>
            )}
            {onAddToCart && (
              <Button 
                onClick={() => onAddToCart(meal)}
                className="h-8 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-semibold px-4 text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-green-400/30"
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MealCard;