import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, Palette, ArrowUp, ArrowDown, Users, ChefHat, Grid, List, MoreVertical, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mealSearchQuery, setMealSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMealAssignmentOpen, setIsMealAssignmentOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchMeals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [categories, searchQuery, showInactive]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" });
    } else {
      setCategories(data || []);
    }
  };

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("id, name, description, category, is_active")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch meals", variant: "destructive" });
    } else {
      setMeals(data || []);
    }
  };

  const applyFilters = () => {
    let filtered = categories;
    
    // Apply active/inactive filter
    if (!showInactive) {
      filtered = filtered.filter(category => category.is_active);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(query) ||
        (category.description && category.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredCategories(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      name: formData.name.toLowerCase().trim(),
      description: formData.description,
      color: formData.color,
      is_active: formData.is_active,
      sort_order: editingCategory ? editingCategory.sort_order : Math.max(...categories.map(c => c.sort_order), 0) + 1
    };

    let result;
    if (editingCategory) {
      result = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", editingCategory.id);
    } else {
      result = await supabase
        .from("categories")
        .insert([categoryData]);
    }

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Category ${editingCategory ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
      fetchMeals();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    
    // Check if any meals use this category
    const { data: mealsWithCategory, error: mealsError } = await supabase
      .from("meals")
      .select("id, name")
      .eq("category", categoryToDelete?.name);

    if (mealsError) {
      toast({ title: "Error", description: "Failed to check for meals using this category", variant: "destructive" });
      return;
    }

    if (mealsWithCategory && mealsWithCategory.length > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: `This category is used by ${mealsWithCategory.length} meal(s). Please reassign or delete those meals first.`,
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategories();
      fetchMeals();
    }
  };

  const toggleActive = async (category: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("id", category.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchCategories();
    }
  };

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedCategories.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetCategory = sortedCategories[targetIndex];

    // Swap sort orders
    const updates = [
      { id: category.id, sort_order: targetCategory.sort_order },
      { id: targetCategory.id, sort_order: category.sort_order }
    ];

    for (const update of updates) {
      await supabase
        .from("categories")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
    }

    fetchCategories();
  };

  const openMealAssignment = (category: Category) => {
    setSelectedCategory(category);
    setMealSearchQuery(""); // Reset search when opening dialog
    setIsMealAssignmentOpen(true);
  };

  const assignMealToCategory = async (mealId: string, newCategoryName: string) => {
    const { error } = await supabase
      .from("meals")
      .update({ category: newCategoryName })
      .eq("id", mealId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Meal category updated successfully" });
      fetchMeals();
    }
  };

  const getMealsInCategory = (categoryName: string) => {
    const mealsInCategory = meals.filter(meal => meal.category === categoryName);
    if (!mealSearchQuery.trim()) return mealsInCategory;
    
    const query = mealSearchQuery.toLowerCase().trim();
    return mealsInCategory.filter(meal =>
      meal.name.toLowerCase().includes(query) ||
      (meal.description && meal.description.toLowerCase().includes(query))
    );
  };

  const getUnassignedMeals = () => {
    const categoryNames = categories.map(c => c.name);
    const unassignedMeals = meals.filter(meal => !categoryNames.includes(meal.category) || !meal.category);
    
    if (!mealSearchQuery.trim()) return unassignedMeals;
    
    const query = mealSearchQuery.toLowerCase().trim();
    return unassignedMeals.filter(meal =>
      meal.name.toLowerCase().includes(query) ||
      (meal.description && meal.description.toLowerCase().includes(query))
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#6366f1",
      is_active: true
    });
    setEditingCategory(null);
  };

  // Get total counts for display (without search filter)
  const getTotalMealsInCategory = (categoryName: string) => {
    return meals.filter(meal => meal.category === categoryName).length;
  };

  const getTotalUnassignedMeals = () => {
    const categoryNames = categories.map(c => c.name);
    return meals.filter(meal => !categoryNames.includes(meal.category) || !meal.category).length;
  };

  const displayedCategories = (filteredCategories.length > 0 || searchQuery || !showInactive) ? filteredCategories : categories;

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card className={`group transition-all duration-200 hover:shadow-md hover:scale-105 border-2 ${!category.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <CardTitle className="text-lg font-semibold capitalize">
                {category.name}
              </CardTitle>
              {!category.is_active && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openMealAssignment(category)}>
                <ChefHat className="h-4 w-4 mr-2" />
                Manage Meals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleActive(category)}>
                {category.is_active ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(category.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {category.description || "No description provided"}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {getTotalMealsInCategory(category.name)} meals
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveCategory(category, 'up')}
              disabled={categories.findIndex(c => c.id === category.id) === 0}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveCategory(category, 'down')}
              disabled={categories.findIndex(c => c.id === category.id) === categories.length - 1}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-muted-foreground">Organize your menu items into categories</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="animate-fade-in">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update category details" : "Add a new category to organize your menu items"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., breakfast, lunch, dessert"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this category..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 p-1 rounded border"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-sm font-medium capitalize">
                      {formData.name || 'Category Preview'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Category</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[280px]"
            />
          </div>

          {/* Show inactive toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">Show inactive</Label>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Categories</p>
                <p className="text-2xl font-bold">{categories.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Meals</p>
                <p className="text-2xl font-bold">{meals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid/List */}
      {displayedCategories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by creating your first category"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={`animate-fade-in ${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {displayedCategories.map((category) => (
            <div key={category.id}>
              {viewMode === 'grid' ? (
                <CategoryCard category={category} />
              ) : (
                <Card className="group transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h3 className="font-semibold capitalize">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-xs">
                          {getTotalMealsInCategory(category.name)} meals
                        </Badge>
                        {!category.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMealAssignment(category)}>
                              <ChefHat className="h-4 w-4 mr-2" />
                              Manage Meals
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(category)}>
                              {category.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(category.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meal Assignment Dialog */}
      <Dialog open={isMealAssignmentOpen} onOpenChange={setIsMealAssignmentOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Manage Meals in "{selectedCategory?.name}" Category
            </DialogTitle>
            <DialogDescription>
              Add or remove meals from this category. You can also move meals to other categories.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search bar for meals */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
                value={mealSearchQuery}
                onChange={(e) => setMealSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Current meals in category */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                <span>Current Meals</span>
                <Badge variant="outline">
                  {mealSearchQuery ? 
                    `${getMealsInCategory(selectedCategory?.name || '').length} of ${getTotalMealsInCategory(selectedCategory?.name || '')}` :
                    getTotalMealsInCategory(selectedCategory?.name || '')
                  }
                </Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getMealsInCategory(selectedCategory?.name || '').map((meal) => (
                  <Card key={meal.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{meal.name}</h5>
                        <p className="text-sm text-muted-foreground line-clamp-1">{meal.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge variant={meal.is_active ? "default" : "secondary"} className="text-xs">
                          {meal.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignMealToCategory(meal.id, '')}
                          className="shrink-0"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {getMealsInCategory(selectedCategory?.name || '').length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {mealSearchQuery ? "No meals match your search" : "No meals in this category yet"}
                    </p>
                    {mealSearchQuery && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setMealSearchQuery("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Unassigned meals */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                <span>Unassigned Meals</span>
                <Badge variant="outline">
                  {mealSearchQuery ? 
                    `${getUnassignedMeals().length} of ${getTotalUnassignedMeals()}` :
                    getTotalUnassignedMeals()
                  }
                </Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getUnassignedMeals().map((meal) => (
                  <Card key={meal.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{meal.name}</h5>
                        <p className="text-sm text-muted-foreground line-clamp-1">{meal.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => assignMealToCategory(meal.id, selectedCategory?.name || '')}
                        className="shrink-0"
                      >
                        Add to {selectedCategory?.name}
                      </Button>
                    </div>
                  </Card>
                ))}
                {getUnassignedMeals().length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {mealSearchQuery ? "No unassigned meals match your search" : "All meals are assigned to categories"}
                    </p>
                    {mealSearchQuery && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setMealSearchQuery("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManager;