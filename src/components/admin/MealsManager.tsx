import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Calculator, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MealBuilder from "./MealBuilder";

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
}

const MealsManager = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "lunch",
    price: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch meals", variant: "destructive" });
    } else {
      setMeals(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mealData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price) || 0
    };

    let result;
    if (editingMeal) {
      result = await supabase
        .from("meals")
        .update(mealData)
        .eq("id", editingMeal.id);
    } else {
      result = await supabase
        .from("meals")
        .insert([mealData]);
    }

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Meal ${editingMeal ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      resetForm();
      fetchMeals();
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      description: meal.description || "",
      category: meal.category || "lunch",
      price: meal.price?.toString() || ""
    });
    setIsDialogOpen(true);
  };

  const handleBuildMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setIsBuilderOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Meal deleted successfully" });
      fetchMeals();
    }
  };

  const toggleActive = async (meal: Meal) => {
    const { error } = await supabase
      .from("meals")
      .update({ is_active: !meal.is_active })
      .eq("id", meal.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchMeals();
    }
  };

  const printMealLabel = async (meal: Meal) => {
    try {
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
              <div class="company-name">Fit Food Tasty</div>
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
                ${meal.total_fiber && meal.total_fiber > 0 ? `
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "lunch",
      price: ""
    });
    setEditingMeal(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast': return 'bg-orange-100 text-orange-800';
      case 'lunch': return 'bg-blue-100 text-blue-800';
      case 'dinner': return 'bg-purple-100 text-purple-800';
      case 'snack': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meals Manager</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMeal ? "Edit Meal" : "Add New Meal"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMeal ? "Update" : "Create"} Meal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Nutrition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meals.map((meal) => (
                <TableRow key={meal.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{meal.name}</div>
                      {meal.description && (
                        <div className="text-sm text-muted-foreground">{meal.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(meal.category)}>
                      {meal.category}
                    </Badge>
                  </TableCell>
                  <TableCell>£{meal.price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{Math.round(meal.total_calories)} kcal</div>
                      <div className="text-muted-foreground">
                        P: {meal.total_protein?.toFixed(1)}g | 
                        C: {meal.total_carbs?.toFixed(1)}g | 
                        F: {meal.total_fat?.toFixed(1)}g
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={meal.is_active ? "default" : "secondary"}>
                      {meal.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printMealLabel(meal)}
                        title="Print Label"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBuildMeal(meal.id)}
                        title="Build Meal"
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(meal)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(meal.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meal Builder - Add Ingredients</DialogTitle>
          </DialogHeader>
          {selectedMealId && (
            <MealBuilder 
              mealId={selectedMealId} 
              onClose={() => {
                setIsBuilderOpen(false);
                fetchMeals(); // Refresh to show updated nutrition
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MealsManager;