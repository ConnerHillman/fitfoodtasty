import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import IngredientSelector from "./IngredientSelector";
import { Upload, Image, DollarSign, ChefHat, Target, Clock } from "lucide-react";
import { normalizeStorageInstructions } from '@/lib/storageInstructionsUtils';
interface Ingredient {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  saturated_fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  salt_per_100g: number;
  default_unit: string;
}
interface Category {
  id: string;
  name: string;
  color: string;
}
interface SelectedIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}
interface MealFormWithIngredientsProps {
  onSuccess: () => void;
  onCancel: () => void;
}
const MealFormWithIngredients = ({
  onSuccess,
  onCancel
}: MealFormWithIngredientsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "lunch",
    price: "",
    image_url: "",
    shelf_life_days: 5,
    storage_heating_instructions: "Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot."
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturated_fat: 0,
    fiber: 0,
    sugar: 0,
    salt: 0,
    weight: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    const {
      data,
      error
    } = await supabase.from("categories").select("id, name, color").eq("is_active", true).order("sort_order");
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive"
      });
    } else {
      setCategories(data || []);
      if (data && data.length > 0 && !formData.category) {
        setFormData(prev => ({
          ...prev,
          category: data[0].name
        }));
      }
    }
  };
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Meal name is required",
        variant: "destructive"
      });
      return;
    }
    if (selectedIngredients.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one ingredient",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const {
            data: uploadData,
            error: uploadError
          } = await supabase.storage.from('meal-images').upload(fileName, imageFile);
          if (uploadError) {
            throw uploadError;
          }
          const {
            data: {
              publicUrl
            }
          } = supabase.storage.from('meal-images').getPublicUrl(fileName);
          imageUrl = publicUrl;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }
      const mealData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        image_url: imageUrl,
        shelf_life_days: formData.shelf_life_days,
        storage_heating_instructions: formData.storage_heating_instructions,
        total_calories: nutrition.calories,
        total_protein: nutrition.protein,
        total_carbs: nutrition.carbs,
        total_fat: nutrition.fat,
        total_saturated_fat: nutrition.saturated_fat,
        total_fiber: nutrition.fiber,
        total_sugar: nutrition.sugar,
        total_salt: nutrition.salt,
        total_weight: nutrition.weight
      };
      const {
        data: mealResult,
        error: mealError
      } = await supabase.from("meals").insert([mealData]).select().single();
      if (mealError) throw mealError;
      const mealIngredientsData = selectedIngredients.map(si => ({
        meal_id: mealResult.id,
        ingredient_id: si.ingredient_id,
        quantity: si.quantity,
        unit: si.unit
      }));
      const {
        error: ingredientsError
      } = await supabase.from("meal_ingredients").insert(mealIngredientsData);
      if (ingredientsError) throw ingredientsError;
      toast({
        title: "Success",
        description: "Meal created successfully with ingredients"
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error creating meal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create meal",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const nutritionStats = [
    { label: "Calories", value: nutrition.calories, unit: "kcal" },
    { label: "Protein", value: nutrition.protein, unit: "g" },
    { label: "Carbs", value: nutrition.carbs, unit: "g" },
    { label: "Fat", value: nutrition.fat, unit: "g" },
  ];
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Create a New Meal</h1>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            <p className="text-muted-foreground text-sm">Craft a nutritious masterpiece with precise ingredient control</p>
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-8 mt-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Details Section */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30 animate-scale-in">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-primary" />
                  Essential Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                      Meal Name 
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({
                    ...formData,
                    name: e.target.value
                  })} placeholder="e.g., Mediterranean Grilled Chicken Bowl" className="h-12 text-lg border-2 focus:border-primary/50 transition-all duration-200" required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="category" className="text-base font-semibold">Category</Label>
                      <Select value={formData.category} onValueChange={value => setFormData({
                      ...formData,
                      category: value
                    })}>
                        <SelectTrigger className="h-12 border-2 focus:border-primary/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                         <SelectContent className="bg-background/95 backdrop-blur-sm border-primary/20 z-50">
                           {categories.map(category => <SelectItem key={category.id} value={category.name}>
                               <div className="flex items-center gap-3 p-1">
                                 <div className="w-6 h-6 rounded-full shadow-lg border-2 border-white/50 bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm" style={{
                               background: `linear-gradient(135deg, ${category.color}00 0%, ${category.color} 100%)`
                             }} />
                                 <span className="font-semibold text-sm tracking-wide capitalize">{category.name}</span>
                               </div>
                             </SelectItem>)}
                         </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="price" className="text-base font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Price (£)
                      </Label>
                      <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({
                      ...formData,
                      price: e.target.value
                    })} placeholder="12.99" className="h-12 border-2 focus:border-primary/50" />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="shelf_life" className="text-base font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Shelf Life (days)
                      </Label>
                      <Input 
                        id="shelf_life" 
                        type="number" 
                        min="1" 
                        max="30" 
                        value={formData.shelf_life_days} 
                        onChange={e => setFormData({
                          ...formData,
                          shelf_life_days: parseInt(e.target.value) || 5
                        })} 
                        placeholder="5" 
                        className="h-12 border-2 focus:border-primary/50" 
                      />
                      <p className="text-sm text-muted-foreground">How many days this meal stays fresh after production</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData({
                    ...formData,
                    description: e.target.value
                  })} placeholder="Describe the flavors, cooking method, and what makes this meal special..." rows={4} className="border-2 focus:border-primary/50 resize-none" />
                  </div>

                  {/* Storage & Heating Instructions */}
                  <div className="space-y-3">
                    <Label htmlFor="storage_heating_instructions" className="text-base font-semibold">
                      Storage and Heating Instructions
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formData.storage_heating_instructions.length}/200)
                      </span>
                    </Label>
                    <Textarea
                      id="storage_heating_instructions"
                      value={formData.storage_heating_instructions}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setFormData({ ...formData, storage_heating_instructions: e.target.value });
                        }
                      }}
                      placeholder="e.g., Store in a refrigerator below 5°c. Heat in a microwave for 3–4 minutes or until piping hot."
                      className="min-h-[100px] border-2 focus:border-primary/50 resize-none"
                    />
                    {formData.storage_heating_instructions.length >= 180 && (
                      <p className="text-xs text-amber-600">
                        Character limit approaching - this ensures proper label formatting
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Include both storage conditions and heating instructions for the best customer experience
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="image" className="text-base font-semibold flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Meal Image
                    </Label>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 hover:border-primary/50 transition-colors duration-200">
                      <Input id="image" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="border-0 bg-transparent p-0 h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                      {imageFile && <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                          <Upload className="h-4 w-4" />
                          {imageFile.name}
                        </div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients Section */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30 animate-scale-in">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ChefHat className="h-5 w-5 text-primary" />
                  Ingredients & Nutrition
                  {selectedIngredients.length > 0 && <Badge className="bg-primary/20 text-primary border-primary/30">
                      {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''}
                    </Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <IngredientSelector selectedIngredients={selectedIngredients} onIngredientsChange={setSelectedIngredients} onNutritionChange={setNutrition} />
              </CardContent>
            </Card>
          </div>

          {/* Nutrition Panel - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Nutrition Summary */}
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30 animate-fade-in">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                  <CardTitle className="text-lg">Nutrition Facts</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {nutritionStats.map((stat, index) => (
                      <div
                        key={stat.label}
                        className="text-center p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-muted animate-fade-in hover-scale"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="text-2xl font-bold text-primary">{Math.round(stat.value)}</div>
                        <div className="text-xs text-muted-foreground">{stat.unit}</div>
                        <div className="text-sm font-medium mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {nutrition.weight > 0 && <>
                      <Separator className="my-4" />
                      <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <div className="text-lg font-semibold text-primary">
                          {Math.round(nutrition.weight)}g
                        </div>
                        <div className="text-sm text-muted-foreground">Total Weight</div>
                      </div>
                    </>}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.name.trim() || selectedIngredients.length === 0}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating meal...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Create Meal
                    </div>
                  )}
                </Button>
                
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full h-12 border-2 hover:bg-muted/50">
                  Cancel
                </Button>
              </div>

              {/* Progress Indicator */}
              <Card className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 border-muted">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">
                      {Math.round(((formData.name ? 1 : 0) + (selectedIngredients.length > 0 ? 1 : 0)) / 2 * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out" style={{
                    width: `${((formData.name ? 1 : 0) + (selectedIngredients.length > 0 ? 1 : 0)) / 2 * 100}%`
                  }} />
                  </div>
                    <div className="text-xs text-muted-foreground">
                      {!formData.name ? "Add meal name" : selectedIngredients.length === 0 ? "Add ingredients" : "Ready to create!"}
                    </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default MealFormWithIngredients;