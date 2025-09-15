import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X, ShoppingCart, DollarSign, Calendar, Users, TrendingUp, Calculator, ChefHat, Plus, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CategoryTag from "../CategoryTag";

interface MealDetailModalProps {
  mealId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
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
  total_fiber?: number;
  total_weight?: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  shelf_life_days: number;
  storage_heating_instructions?: string;
}

interface Ingredient {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  default_unit: string;
}

interface MealIngredient {
  id: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface MealStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  popularityRank: number;
  lastOrderDate: string | null;
  monthlyOrders: { month: string; orders: number; revenue: number }[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const MealDetailModal = ({ mealId, isOpen, onClose, onUpdate }: MealDetailModalProps) => {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<'none' | 'basic' | 'nutrition' | 'ingredients'>('none');
  const [editData, setEditData] = useState<any>({});
  const [newIngredient, setNewIngredient] = useState({
    ingredient_id: '',
    quantity: '',
    unit: 'g'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (mealId && isOpen) {
      fetchMealDetails();
      fetchAvailableIngredients();
      fetchCategories();
    }
  }, [mealId, isOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAvailableIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");

      if (error) throw error;
      setAvailableIngredients(data || []);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const fetchMealDetails = async () => {
    if (!mealId) return;
    
    setLoading(true);
    try {
      // Fetch meal basic info
      const { data: mealData, error: mealError } = await supabase
        .from("meals")
        .select("*")
        .eq("id", mealId)
        .single();

      if (mealError) throw mealError;
      setMeal(mealData);
      setEditData(mealData);

      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from("meal_ingredients")
        .select(`
          id,
          quantity,
          unit,
          ingredient:ingredients(*)
        `)
        .eq("meal_id", mealId);

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      // Fetch order statistics
      await fetchMealStats(mealId);

    } catch (error: any) {
      console.error("Error fetching meal details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meal details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMealStats = async (mealId: string) => {
    try {
      // Get total orders and revenue
      const { data: orderItems, error: orderError } = await supabase
        .from("order_items")
        .select(`
          quantity,
          total_price,
          order:orders(created_at, status)
        `)
        .eq("meal_id", mealId);

      if (orderError) throw orderError;

      const completedOrders = orderItems?.filter(item => 
        item.order?.status === 'completed' || item.order?.status === 'delivered'
      ) || [];

      const totalOrders = completedOrders.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = completedOrders.reduce((sum, item) => sum + item.total_price, 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get last order date
      const lastOrderDate = completedOrders.length > 0 
        ? Math.max(...completedOrders.map(item => new Date(item.order.created_at).getTime()))
        : null;

      // Calculate monthly data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = completedOrders
        .filter(item => new Date(item.order.created_at) >= sixMonthsAgo)
        .reduce((acc: any, item) => {
          const month = new Date(item.order.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          if (!acc[month]) {
            acc[month] = { orders: 0, revenue: 0 };
          }
          acc[month].orders += item.quantity;
          acc[month].revenue += item.total_price;
          return acc;
        }, {});

      const monthlyOrders = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
        month,
        orders: data.orders,
        revenue: data.revenue,
      }));

      setStats({
        totalOrders,
        totalRevenue,
        avgOrderValue,
        popularityRank: 0, // Could be calculated by comparing with other meals
        lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toLocaleDateString() : null,
        monthlyOrders,
      });

    } catch (error) {
      console.error("Error fetching meal stats:", error);
    }
  };

  const recalculateNutrition = async () => {
    if (!meal) return;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalWeight = 0;

    ingredients.forEach((ing) => {
      const factor = ing.quantity / 100; // Convert to per 100g
      totalCalories += ing.ingredient.calories_per_100g * factor;
      totalProtein += ing.ingredient.protein_per_100g * factor;
      totalCarbs += ing.ingredient.carbs_per_100g * factor;
      totalFat += ing.ingredient.fat_per_100g * factor;
      totalFiber += (ing.ingredient.fiber_per_100g || 0) * factor;
      totalWeight += ing.quantity;
    });

    try {
      const { error } = await supabase
        .from("meals")
        .update({
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat,
          total_fiber: totalFiber,
          total_weight: totalWeight,
        })
        .eq("id", meal.id);

      if (error) throw error;

      // Update local state
      setMeal({
        ...meal,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        total_fiber: totalFiber,
        total_weight: totalWeight,
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating nutrition:", error);
    }
  };

  const handleSaveBasic = async () => {
    if (!meal) return;

    try {
      const { error } = await supabase
        .from("meals")
        .update({
          name: editData.name,
          description: editData.description,
          price: parseFloat(editData.price),
          category: editData.category,
          shelf_life_days: parseInt(editData.shelf_life_days),
          storage_heating_instructions: editData.storage_heating_instructions,
        })
        .eq("id", meal.id);

      if (error) throw error;

      setMeal({ ...meal, ...editData });
      setEditMode('none');
      onUpdate();
      toast({
        title: "Success",
        description: "Meal details updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveNutrition = async () => {
    if (!meal) return;

    try {
      const { error } = await supabase
        .from("meals")
        .update({
          total_calories: parseFloat(editData.total_calories),
          total_protein: parseFloat(editData.total_protein),
          total_carbs: parseFloat(editData.total_carbs),
          total_fat: parseFloat(editData.total_fat),
          total_fiber: parseFloat(editData.total_fiber || 0),
          total_weight: parseFloat(editData.total_weight || 0),
        })
        .eq("id", meal.id);

      if (error) throw error;

      setMeal({ ...meal, ...editData });
      setEditMode('none');
      onUpdate();
      toast({
        title: "Success",
        description: "Nutrition updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddIngredient = async () => {
    if (!meal || !newIngredient.ingredient_id || !newIngredient.quantity) {
      toast({
        title: "Error",
        description: "Please select an ingredient and enter quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("meal_ingredients")
        .insert([{
          meal_id: meal.id,
          ingredient_id: newIngredient.ingredient_id,
          quantity: parseFloat(newIngredient.quantity),
          unit: newIngredient.unit
        }]);

      if (error) throw error;

      setNewIngredient({ ingredient_id: '', quantity: '', unit: 'g' });
      await fetchMealDetails(); // Refresh data
      await recalculateNutrition();
      
      toast({
        title: "Success",
        description: "Ingredient added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateIngredientQuantity = async (ingredientId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from("meal_ingredients")
        .update({ quantity: newQuantity })
        .eq("id", ingredientId);

      if (error) throw error;

      // Update local state
      setIngredients(ingredients.map(ing => 
        ing.id === ingredientId ? { ...ing, quantity: newQuantity } : ing
      ));

      await recalculateNutrition();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveIngredient = async (ingredientId: string) => {
    try {
      const { error } = await supabase
        .from("meal_ingredients")
        .delete()
        .eq("id", ingredientId);

      if (error) throw error;

      setIngredients(ingredients.filter(ing => ing.id !== ingredientId));
      await recalculateNutrition();
      
      toast({
        title: "Success",
        description: "Ingredient removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditData({
      ...meal,
      storage_heating_instructions: meal.storage_heating_instructions || 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.'
    });
    setEditMode('none');
  };

  if (!meal) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            {loading ? "Loading..." : "Meal not found"}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ChefHat className="h-6 w-6" />
            Meal Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                {editMode !== 'basic' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode('basic')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveBasic}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    {editMode === 'basic' ? (
                      <Input
                        value={editData.name || ''}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                      />
                    ) : (
                      <p className="font-medium">{meal.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>Price</Label>
                    {editMode === 'basic' ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.price || ''}
                        onChange={(e) => setEditData({...editData, price: e.target.value})}
                      />
                    ) : (
                      <p className="font-medium">£{meal.price?.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  {editMode === 'basic' ? (
                    <Textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={3}
                    />
                  ) : (
                    <p>{meal.description || 'No description available'}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Shelf Life (days)
                  </Label>
                  {editMode === 'basic' ? (
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={editData.shelf_life_days || ''}
                      onChange={(e) => setEditData({...editData, shelf_life_days: e.target.value})}
                    />
                  ) : (
                    <p className="font-medium">{meal.shelf_life_days} days</p>
                  )}
                </div>

                {/* Storage & Heating Instructions */}
                <div>
                  <Label>Storage and Heating Instructions
                    {editMode === 'basic' && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(editData.storage_heating_instructions || '').length}/200)
                      </span>
                    )}
                  </Label>
                  {editMode === 'basic' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editData.storage_heating_instructions || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 200) {
                            setEditData({...editData, storage_heating_instructions: e.target.value});
                          }
                        }}
                        placeholder="e.g., Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot."
                        className="min-h-[100px] resize-none"
                      />
                      {(editData.storage_heating_instructions || '').length >= 180 && (
                        <p className="text-xs text-amber-600">
                          Character limit approaching
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Include both storage and heating instructions for the best customer experience
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm bg-muted/50 p-3 rounded border whitespace-pre-wrap">
                      {meal.storage_heating_instructions || 'Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot.'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <Label>Category</Label>
                    <div className="mt-1">
                      {editMode === 'basic' ? (
                        <Select 
                          value={editData.category || ''} 
                          onValueChange={(value) => setEditData({...editData, category: value})}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <CategoryTag category={meal.category} />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <Badge variant={meal.is_active ? "default" : "secondary"}>
                        {meal.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(meal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Nutrition Information
                </CardTitle>
                {editMode !== 'nutrition' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode('nutrition')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNutrition}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <Label>Calories</Label>
                    {editMode === 'nutrition' ? (
                      <Input
                        type="number"
                        value={editData.total_calories || ''}
                        onChange={(e) => setEditData({...editData, total_calories: e.target.value})}
                        className="text-center"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-primary">{Math.round(meal.total_calories)}</div>
                    )}
                    <div className="text-sm text-muted-foreground">kcal</div>
                  </div>
                  <div className="text-center">
                    <Label>Protein</Label>
                    {editMode === 'nutrition' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editData.total_protein || ''}
                        onChange={(e) => setEditData({...editData, total_protein: e.target.value})}
                        className="text-center"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-blue-600">{meal.total_protein?.toFixed(1)}g</div>
                    )}
                    <div className="text-sm text-muted-foreground">protein</div>
                  </div>
                  <div className="text-center">
                    <Label>Carbs</Label>
                    {editMode === 'nutrition' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editData.total_carbs || ''}
                        onChange={(e) => setEditData({...editData, total_carbs: e.target.value})}
                        className="text-center"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-green-600">{meal.total_carbs?.toFixed(1)}g</div>
                    )}
                    <div className="text-sm text-muted-foreground">carbs</div>
                  </div>
                  <div className="text-center">
                    <Label>Fat</Label>
                    {editMode === 'nutrition' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editData.total_fat || ''}
                        onChange={(e) => setEditData({...editData, total_fat: e.target.value})}
                        className="text-center"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-yellow-600">{meal.total_fat?.toFixed(1)}g</div>
                    )}
                    <div className="text-sm text-muted-foreground">fat</div>
                  </div>
                  <div className="text-center">
                    <Label>Fiber</Label>
                    {editMode === 'nutrition' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editData.total_fiber || ''}
                        onChange={(e) => setEditData({...editData, total_fiber: e.target.value})}
                        className="text-center"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-purple-600">{meal.total_fiber?.toFixed(1) || '0'}g</div>
                    )}
                    <div className="text-sm text-muted-foreground">fiber</div>
                  </div>
                  <div className="text-center">
                    <Label>Weight</Label>
                    {editMode === 'nutrition' ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editData.total_weight || ''}
                        onChange={(e) => setEditData({...editData, total_weight: e.target.value})}
                        className="text-center"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gray-600">{meal.total_weight?.toFixed(0) || '0'}g</div>
                    )}
                    <div className="text-sm text-muted-foreground">total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ingredients List</CardTitle>
                {editMode !== 'ingredients' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode('ingredients')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode('none')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editMode === 'ingredients' && (
                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg mb-4">
                    <div className="col-span-2">
                      <Label>Add Ingredient</Label>
                      <Select value={newIngredient.ingredient_id} onValueChange={(value) => setNewIngredient({...newIngredient, ingredient_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIngredients.map((ingredient) => (
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
                        value={newIngredient.quantity}
                        onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddIngredient} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {ingredients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Calories</TableHead>
                        <TableHead>Protein</TableHead>
                        <TableHead>Carbs</TableHead>
                        <TableHead>Fat</TableHead>
                        {editMode === 'ingredients' && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredients.map((ing) => {
                        const factor = ing.quantity / 100;
                        return (
                          <TableRow key={ing.id}>
                            <TableCell className="font-medium">{ing.ingredient.name}</TableCell>
                            <TableCell>
                              {editMode === 'ingredients' ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={ing.quantity}
                                  onChange={(e) => handleUpdateIngredientQuantity(ing.id, parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                />
                              ) : (
                                `${ing.quantity}${ing.unit}`
                              )}
                            </TableCell>
                            <TableCell>{Math.round(ing.ingredient.calories_per_100g * factor)}</TableCell>
                            <TableCell>{(ing.ingredient.protein_per_100g * factor).toFixed(1)}g</TableCell>
                            <TableCell>{(ing.ingredient.carbs_per_100g * factor).toFixed(1)}g</TableCell>
                            <TableCell>{(ing.ingredient.fat_per_100g * factor).toFixed(1)}g</TableCell>
                            {editMode === 'ingredients' && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveIngredient(ing.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No ingredients found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                        <div className="text-sm font-medium">Total Orders</div>
                      </div>
                      <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div className="text-sm font-medium">Total Revenue</div>
                      </div>
                      <div className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <div className="text-sm font-medium">Avg Order Value</div>
                      </div>
                      <div className="text-2xl font-bold">£{stats.avgOrderValue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <div className="text-sm font-medium">Last Order</div>
                      </div>
                      <div className="text-lg font-bold">{stats.lastOrderDate || 'Never'}</div>
                    </CardContent>
                  </Card>
                </div>

                {stats.monthlyOrders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.monthlyOrders.map((month) => (
                            <TableRow key={month.month}>
                              <TableCell>{month.month}</TableCell>
                              <TableCell>{month.orders}</TableCell>
                              <TableCell>£{month.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MealDetailModal;