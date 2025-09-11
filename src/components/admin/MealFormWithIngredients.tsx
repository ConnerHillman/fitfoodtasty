import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import IngredientSelector from "./IngredientSelector";

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

const MealFormWithIngredients = ({ onSuccess, onCancel }: MealFormWithIngredientsProps) => {
  const [currentTab, setCurrentTab] = useState("details");
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "lunch",
    price: "",
    image_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    weight: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, color")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" });
    } else {
      setCategories(data || []);
      // Set default category if available
      if (data && data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Meal name is required", variant: "destructive" });
      return;
    }

    if (selectedIngredients.length === 0) {
      toast({ title: "Error", description: "Please add at least one ingredient", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if a new file is selected
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('meal-images')
            .upload(fileName, imageFile);
          
          if (uploadError) {
            throw uploadError;
          }
          
          // Get the public URL for the uploaded image
          const { data: { publicUrl } } = supabase.storage
            .from('meal-images')
            .getPublicUrl(fileName);
          
          imageUrl = publicUrl;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create the meal with nutrition data
      const mealData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        image_url: imageUrl,
        total_calories: nutrition.calories,
        total_protein: nutrition.protein,
        total_carbs: nutrition.carbs,
        total_fat: nutrition.fat,
        total_fiber: nutrition.fiber,
        total_sugar: nutrition.sugar,
        total_sodium: nutrition.sodium,
        total_weight: nutrition.weight
      };

      const { data: mealResult, error: mealError } = await supabase
        .from("meals")
        .insert([mealData])
        .select()
        .single();

      if (mealError) throw mealError;

      // Add ingredients to the meal
      const mealIngredientsData = selectedIngredients.map(si => ({
        meal_id: mealResult.id,
        ingredient_id: si.ingredient_id,
        quantity: si.quantity,
        unit: si.unit
      }));

      const { error: ingredientsError } = await supabase
        .from("meal_ingredients")
        .insert(mealIngredientsData);

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

  const canProceedToIngredients = formData.name.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Meal</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Meal Details</TabsTrigger>
              <TabsTrigger value="ingredients" disabled={!canProceedToIngredients}>
                Ingredients {selectedIngredients.length > 0 && `(${selectedIngredients.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Meal Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter meal name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the meal..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentTab("ingredients")}
                  disabled={!canProceedToIngredients}
                >
                  Next: Add Ingredients
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="ingredients" className="mt-6">
              <IngredientSelector
                selectedIngredients={selectedIngredients}
                onIngredientsChange={setSelectedIngredients}
                onNutritionChange={setNutrition}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <div className="flex space-x-2">
          {currentTab === "ingredients" && (
            <Button variant="outline" onClick={() => setCurrentTab("details")}>
              Back to Details
            </Button>
          )}
          {currentTab === "ingredients" && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || selectedIngredients.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Meal"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealFormWithIngredients;