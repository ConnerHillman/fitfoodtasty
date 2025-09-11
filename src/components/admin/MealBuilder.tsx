import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  default_unit: string;
}

interface MealIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface MealBuilderProps {
  mealId: string;
  onClose: () => void;
}

const MealBuilder = ({ mealId, onClose }: MealBuilderProps) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [mealNutrition, setMealNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    weight: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIngredients();
    fetchMealIngredients();
  }, [mealId]);

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch ingredients", variant: "destructive" });
    } else {
      setIngredients(data || []);
    }
  };

  const fetchMealIngredients = async () => {
    const { data, error } = await supabase
      .from("meal_ingredients")
      .select(`
        id,
        ingredient_id,
        quantity,
        unit,
        ingredient:ingredients(*)
      `)
      .eq("meal_id", mealId);

    if (error) {
      toast({ title: "Error", description: "Failed to fetch meal ingredients", variant: "destructive" });
    } else {
      setMealIngredients(data || []);
      calculateNutrition(data || []);
    }
  };

  const calculateNutrition = async (mealIngs: MealIngredient[]) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalWeight = 0;

    mealIngs.forEach((mi) => {
      const factor = mi.quantity / 100; // Convert to per 100g
      totalCalories += mi.ingredient.calories_per_100g * factor;
      totalProtein += mi.ingredient.protein_per_100g * factor;
      totalCarbs += mi.ingredient.carbs_per_100g * factor;
      totalFat += mi.ingredient.fat_per_100g * factor;
      totalWeight += mi.quantity;
    });

    const nutritionData = {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      weight: totalWeight
    };

    setMealNutrition(nutritionData);

    // Save nutrition totals to the meals table
    const { error } = await supabase
      .from("meals")
      .update({
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        total_weight: totalWeight
      })
      .eq("id", mealId);

    if (error) {
      console.error("Error updating meal nutrition:", error);
      toast({ 
        title: "Warning", 
        description: "Nutrition calculated but failed to save to meal", 
        variant: "destructive" 
      });
    }
  };

  const addIngredient = async () => {
    if (!selectedIngredientId || !quantity) {
      toast({ title: "Error", description: "Please select an ingredient and enter quantity", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("meal_ingredients")
      .insert([{
        meal_id: mealId,
        ingredient_id: selectedIngredientId,
        quantity: parseFloat(quantity),
        unit: unit
      }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ingredient added to meal" });
      setSelectedIngredientId("");
      setQuantity("");
      setUnit("g");
      fetchMealIngredients();
    }
  };

  const removeIngredient = async (ingredientId: string) => {
    const { error } = await supabase
      .from("meal_ingredients")
      .delete()
      .eq("id", ingredientId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ingredient removed from meal" });
      fetchMealIngredients();
    }
  };

  const updateQuantity = async (ingredientId: string, newQuantity: number) => {
    const { error } = await supabase
      .from("meal_ingredients")
      .update({ quantity: newQuantity })
      .eq("id", ingredientId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchMealIngredients();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Ingredient Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Ingredient</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label>Ingredient</Label>
              <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addIngredient} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Nutrition Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{Math.round(mealNutrition.calories)}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{mealNutrition.protein.toFixed(1)}g</div>
              <div className="text-sm text-muted-foreground">Protein</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{mealNutrition.carbs.toFixed(1)}g</div>
              <div className="text-sm text-muted-foreground">Carbs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{mealNutrition.fat.toFixed(1)}g</div>
              <div className="text-sm text-muted-foreground">Fat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{mealNutrition.weight.toFixed(0)}g</div>
              <div className="text-sm text-muted-foreground">Total Weight</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients List */}
      <Card>
        <CardHeader>
          <CardTitle>Meal Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Protein</TableHead>
                <TableHead>Carbs</TableHead>
                <TableHead>Fat</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mealIngredients.map((mi) => {
                const factor = mi.quantity / 100;
                return (
                  <TableRow key={mi.id}>
                    <TableCell className="font-medium">{mi.ingredient.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={mi.quantity}
                          onChange={(e) => updateQuantity(mi.id, parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Badge variant="secondary">{mi.unit}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{Math.round(mi.ingredient.calories_per_100g * factor)} kcal</TableCell>
                    <TableCell>{(mi.ingredient.protein_per_100g * factor).toFixed(1)}g</TableCell>
                    <TableCell>{(mi.ingredient.carbs_per_100g * factor).toFixed(1)}g</TableCell>
                    <TableCell>{(mi.ingredient.fat_per_100g * factor).toFixed(1)}g</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeIngredient(mi.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default MealBuilder;