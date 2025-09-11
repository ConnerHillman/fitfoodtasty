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
  fiber_per_100g: number;
  sugar_per_100g: number;
  sodium_per_100g: number;
  default_unit: string;
}

interface SelectedIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface IngredientSelectorProps {
  selectedIngredients: SelectedIngredient[];
  onIngredientsChange: (ingredients: SelectedIngredient[]) => void;
  onNutritionChange: (nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    weight: number;
  }) => void;
}

const IngredientSelector = ({ selectedIngredients, onIngredientsChange, onNutritionChange }: IngredientSelectorProps) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const { toast } = useToast();

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    calculateNutrition();
  }, [selectedIngredients]);

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

  const calculateNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;
    let totalWeight = 0;

    selectedIngredients.forEach((si) => {
      const factor = si.quantity / 100;
      totalCalories += si.ingredient.calories_per_100g * factor;
      totalProtein += si.ingredient.protein_per_100g * factor;
      totalCarbs += si.ingredient.carbs_per_100g * factor;
      totalFat += si.ingredient.fat_per_100g * factor;
      totalFiber += (si.ingredient.fiber_per_100g || 0) * factor;
      totalSugar += (si.ingredient.sugar_per_100g || 0) * factor;
      totalSodium += (si.ingredient.sodium_per_100g || 0) * factor;
      totalWeight += si.quantity;
    });

    onNutritionChange({
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      fiber: totalFiber,
      sugar: totalSugar,
      sodium: totalSodium,
      weight: totalWeight
    });
  };

  const addIngredient = () => {
    if (!selectedIngredientId || !quantity) {
      toast({ title: "Error", description: "Please select an ingredient and enter quantity", variant: "destructive" });
      return;
    }

    const ingredient = ingredients.find(i => i.id === selectedIngredientId);
    if (!ingredient) return;

    const newIngredient: SelectedIngredient = {
      id: `temp-${Date.now()}`,
      ingredient_id: selectedIngredientId,
      quantity: parseFloat(quantity),
      unit: unit,
      ingredient: ingredient
    };

    onIngredientsChange([...selectedIngredients, newIngredient]);
    setSelectedIngredientId("");
    setQuantity("");
    setUnit("g");
  };

  const removeIngredient = (ingredientId: string) => {
    onIngredientsChange(selectedIngredients.filter(si => si.id !== ingredientId));
  };

  const updateQuantity = (ingredientId: string, newQuantity: number) => {
    onIngredientsChange(
      selectedIngredients.map(si => 
        si.id === ingredientId 
          ? { ...si, quantity: newQuantity }
          : si
      )
    );
  };

  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    weight: 0
  };

  selectedIngredients.forEach((si) => {
    const factor = si.quantity / 100;
    nutrition.calories += si.ingredient.calories_per_100g * factor;
    nutrition.protein += si.ingredient.protein_per_100g * factor;
    nutrition.carbs += si.ingredient.carbs_per_100g * factor;
    nutrition.fat += si.ingredient.fat_per_100g * factor;
    nutrition.fiber += (si.ingredient.fiber_per_100g || 0) * factor;
    nutrition.sugar += (si.ingredient.sugar_per_100g || 0) * factor;
    nutrition.sodium += (si.ingredient.sodium_per_100g || 0) * factor;
    nutrition.weight += si.quantity;
  });

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
      {selectedIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Nutrition Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{Math.round(nutrition.calories)}</div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{nutrition.protein.toFixed(1)}g</div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{nutrition.carbs.toFixed(1)}g</div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{nutrition.fat.toFixed(1)}g</div>
                <div className="text-sm text-muted-foreground">Fat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredients List */}
      {selectedIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Ingredients</CardTitle>
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
                {selectedIngredients.map((si) => {
                  const factor = si.quantity / 100;
                  return (
                    <TableRow key={si.id}>
                      <TableCell className="font-medium">{si.ingredient.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={si.quantity}
                            onChange={(e) => updateQuantity(si.id, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <Badge variant="secondary">{si.unit}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{Math.round(si.ingredient.calories_per_100g * factor)} kcal</TableCell>
                      <TableCell>{(si.ingredient.protein_per_100g * factor).toFixed(1)}g</TableCell>
                      <TableCell>{(si.ingredient.carbs_per_100g * factor).toFixed(1)}g</TableCell>
                      <TableCell>{(si.ingredient.fat_per_100g * factor).toFixed(1)}g</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeIngredient(si.id)}
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
      )}
    </div>
  );
};

export default IngredientSelector;