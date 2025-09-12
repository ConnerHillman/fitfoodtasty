import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Calculator, Printer, Filter, Search, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MealBuilder from "./MealBuilder";
import MealFormWithIngredients from "./MealFormWithIngredients";

interface Category {
  id: string;
  name: string;
  color: string;
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
  sort_order: number;
}

const MealsManager = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isNewMealFormOpen, setIsNewMealFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "lunch",
    price: "",
    image_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeals();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [meals, statusFilter, searchQuery]);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch meals", variant: "destructive" });
    } else {
      setMeals(data || []);
    }
  };

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
    }
  };

  const applyFilters = () => {
    let filtered = meals;
    
    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(meal => meal.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(meal => !meal.is_active);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(meal =>
        meal.name.toLowerCase().includes(query) ||
        (meal.description && meal.description.toLowerCase().includes(query)) ||
        (meal.category && meal.category.toLowerCase().includes(query))
      );
    }
    
    setFilteredMeals(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
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
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
    }
    
    const mealData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      image_url: imageUrl
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
    setIsUploading(false);
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      description: meal.description || "",
      category: meal.category || "lunch",
      price: meal.price?.toString() || "",
      image_url: (meal as any).image_url || ""
    });
    setImageFile(null);
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

  const moveMeal = async (mealId: string, direction: 'up' | 'down') => {
    const currentIndex = meals.findIndex(m => m.id === mealId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= meals.length) return;

    const currentMeal = meals[currentIndex];
    const targetMeal = meals[newIndex];

    // Swap sort_order values
    const { error: error1 } = await supabase
      .from("meals")
      .update({ sort_order: targetMeal.sort_order })
      .eq("id", currentMeal.id);

    const { error: error2 } = await supabase
      .from("meals")
      .update({ sort_order: currentMeal.sort_order })
      .eq("id", targetMeal.id);

    if (error1 || error2) {
      toast({ title: "Error", description: "Failed to reorder meals", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Meal order updated" });
      fetchMeals();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "lunch",
      price: "",
      image_url: ""
    });
    setImageFile(null);
    setEditingMeal(null);
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#3b82f6';
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Meals Manager</h2>
              <p className="text-muted-foreground">Create and manage your meal offerings with professional precision</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60"></div>
                  {filteredMeals.length} meals total
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  {filteredMeals.filter(m => m.is_active).length} active
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                variant="outline"
                size="lg"
                className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Create
              </Button>
              <Button
                onClick={() => setIsNewMealFormOpen(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Full Editor
              </Button>
            </div>
          </div>
        </div>
      </div>
              <Plus className="mr-2 h-5 w-5" />
              Quick Create
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsNewMealFormOpen(true);
              }}
              variant="outline"
              className="bg-white text-primary hover:bg-white/90 border-white/30 shadow-lg"
              size="lg"
            >
              <Edit className="mr-2 h-5 w-5" />
              Full Editor
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Search and Filter Controls */}
      <div className="glass-card rounded-2xl p-6 animate-slide-in-up">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search meals by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg border-0 bg-white/50 focus:bg-white/80 transition-all duration-300 rounded-xl shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[160px] h-12 border-0 bg-white/50 hover:bg-white/80 transition-all duration-300 rounded-xl shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 bg-white/95 backdrop-blur-sm shadow-xl">
                <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
                <SelectItem value="active" className="rounded-lg">Active Only</SelectItem>
                <SelectItem value="inactive" className="rounded-lg">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-white/30 rounded-lg px-3 py-2">
              <span className="font-medium text-primary">{filteredMeals.length}</span>
              <span>of {meals.length} meals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Meals Grid */}
      <div className="space-y-6">
        {filteredMeals.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-bounce-subtle">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No meals found" : "No meals yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? "Try adjusting your search terms or filters" 
                : "Create your first delicious meal to get started!"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  resetForm();
                  setIsNewMealFormOpen(true);
                }}
                className="gradient-primary text-white hover:opacity-90 shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Meal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeals.map((meal, index) => (
              <div
                key={meal.id}
                className="group glass-card rounded-2xl overflow-hidden hover-lift hover-glow animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Meal Image */}
                <div className="relative h-48 overflow-hidden">
                  {(meal as any).image_url ? (
                    <img
                      src={(meal as any).image_url}
                      alt={meal.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-primary/60 mx-auto mb-2" />
                        <span className="text-sm text-primary/80 font-medium">No Image</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={meal.is_active 
                        ? "status-active shadow-lg animate-pulse" 
                        : "status-inactive"}
                    >
                      {meal.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  {/* Order Controls */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => moveMeal(meal.id, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => moveMeal(meal.id, 'down')}
                      disabled={index === filteredMeals.length - 1}
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Meal Content */}
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg leading-tight">{meal.name}</h3>
                      <span className="font-bold text-xl text-primary">£{meal.price.toFixed(2)}</span>
                    </div>
                    {meal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {meal.description}
                      </p>
                    )}
                    {meal.category && (
                      <Badge 
                        style={{ backgroundColor: getCategoryColor(meal.category) }}
                        className="text-white text-xs"
                      >
                        {meal.category}
                      </Badge>
                    )}
                  </div>

                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{Math.round(meal.total_calories)}</div>
                      <div className="text-xs text-muted-foreground">calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{(meal.total_protein || 0).toFixed(0)}g</div>
                      <div className="text-xs text-muted-foreground">protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{(meal.total_carbs || 0).toFixed(0)}g</div>
                      <div className="text-xs text-muted-foreground">carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{(meal.total_fat || 0).toFixed(0)}g</div>
                      <div className="text-xs text-muted-foreground">fat</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printMealLabel(meal)}
                      className="h-10 hover-glow"
                      title="Print Label"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBuildMeal(meal.id)}
                      className="h-10 hover-glow"
                      title="Build/Edit Ingredients"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(meal)}
                      className="h-10 hover-glow"
                      title="Edit Meal"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(meal)}
                      className={`h-10 ${meal.is_active 
                        ? "text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" 
                        : "text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"}`}
                      title="Toggle Status"
                    >
                      {meal.is_active ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4 opacity-50" />}
                    </Button>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(meal.id)}
                    className="w-full text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Meal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMeal ? "Edit Meal" : "Quick Add Meal"}
            </DialogTitle>
            <DialogDescription>
              Create or edit a meal quickly. Use the full editor for advanced features.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Meal Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter meal name..."
                  required
                />
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this meal..."
                rows={3}
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="image">Meal Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                  }
                }}
              />
              {formData.image_url && !imageFile && (
                <div className="mt-2">
                  <img 
                    src={formData.image_url} 
                    alt="Current meal image" 
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
              {imageFile && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="gradient-primary text-white">
                {isUploading ? "Uploading..." : editingMeal ? "Update" : "Create"} Meal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Meal Creation Dialog */}
      <Dialog open={isNewMealFormOpen} onOpenChange={setIsNewMealFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Meal with Ingredients</DialogTitle>
            <DialogDescription>
              Add ingredients while creating the meal. Nutrition totals update automatically.
            </DialogDescription>
          </DialogHeader>
          <MealFormWithIngredients
            onSuccess={() => {
              setIsNewMealFormOpen(false);
              fetchMeals();
            }}
            onCancel={() => setIsNewMealFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Meal Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meal Builder - Add Ingredients</DialogTitle>
            <DialogDescription>Manage ingredients for an existing meal and recalculate nutrition.</DialogDescription>
          </DialogHeader>
          {selectedMealId && (
            <MealBuilder 
              mealId={selectedMealId} 
              onClose={() => {
                setIsBuilderOpen(false);
                fetchMeals(); // Refresh to show updated nutrition
              }}
              onNutritionUpdate={(data) => {
                // Optimistically update the list while the builder is open
                setMeals((prev) => prev.map((m) =>
                  m.id === selectedMealId
                    ? {
                        ...m,
                        total_calories: data.calories,
                        total_protein: data.protein,
                        total_carbs: data.carbs,
                        total_fat: data.fat,
                        total_weight: data.weight,
                      }
                    : m
                ));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </Dialog>
    </div>
  );
};

export default MealsManager;