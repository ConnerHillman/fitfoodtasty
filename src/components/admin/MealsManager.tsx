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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, Calculator, Printer, Filter, Search, ChevronUp, ChevronDown, ImageIcon, Grid, List, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MealBuilder from "./MealBuilder";
import MealFormWithIngredients from "./MealFormWithIngredients";
import MealAnalytics from "./MealAnalytics";
import CategoryTag from "../CategoryTag";

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
  }, [meals, statusFilter, searchQuery, categoryFilter]);

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
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(meal => meal.category === categoryFilter);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meals Management</h2>
          <p className="text-muted-foreground">
            Manage your meal offerings, prices, and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewMealFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Build with Ingredients
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add Meal
          </Button>
        </div>
      </div>

      <Tabs defaultValue="management" className="w-full">
        <TabsList>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Meals Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMeals.map((meal) => (
                <Card key={meal.id} className="overflow-hidden">
                  <div className="relative h-48">
                    {meal.image_url ? (
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant={meal.is_active ? "default" : "secondary"}
                      className="absolute top-2 right-2"
                    >
                      {meal.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold line-clamp-1">{meal.name}</h3>
                        <span className="font-bold text-primary">£{meal.price?.toFixed(2)}</span>
                      </div>
                      {meal.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{meal.description}</p>
                      )}
                      <CategoryTag category={meal.category} />
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Cal: {Math.round(meal.total_calories)}</span>
                        <span>Protein: {meal.total_protein?.toFixed(1)}g</span>
                        <span>Carbs: {meal.total_carbs?.toFixed(1)}g</span>
                        <span>Fat: {meal.total_fat?.toFixed(1)}g</span>
                      </div>
                      <div className="flex items-center gap-1 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBuildMeal(meal.id)}
                          className="flex-1"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Build
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(meal)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(meal)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(meal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Nutrition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeals.map((meal) => (
                    <TableRow key={meal.id}>
                      <TableCell>
                        {meal.image_url ? (
                          <img
                            src={meal.image_url}
                            alt={meal.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{meal.name}</div>
                          {meal.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {meal.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategoryTag category={meal.category} />
                      </TableCell>
                      <TableCell className="font-medium">£{meal.price?.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>Cal: {Math.round(meal.total_calories)}</div>
                          <div>P: {meal.total_protein?.toFixed(1)}g C: {meal.total_carbs?.toFixed(1)}g F: {meal.total_fat?.toFixed(1)}g</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={meal.is_active ? "default" : "secondary"}>
                          {meal.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBuildMeal(meal.id)}
                          >
                            <Calculator className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(meal)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(meal)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(meal.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Quick Add Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingMeal ? "Edit Meal" : "Add New Meal"}</DialogTitle>
                <DialogDescription>
                  {editingMeal ? "Update the meal details below." : "Create a new meal by filling out the form below."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Meal name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (£)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Meal description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Saving..." : editingMeal ? "Update Meal" : "Add Meal"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {isNewMealFormOpen && (
            <MealFormWithIngredients
              onSuccess={() => {
                setIsNewMealFormOpen(false);
                fetchMeals();
              }}
              onCancel={() => setIsNewMealFormOpen(false)}
            />
          )}

          {isBuilderOpen && selectedMealId && (
            <MealBuilder
              mealId={selectedMealId}
              onClose={() => setIsBuilderOpen(false)}
              onNutritionUpdate={() => fetchMeals()}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <MealAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MealsManager;