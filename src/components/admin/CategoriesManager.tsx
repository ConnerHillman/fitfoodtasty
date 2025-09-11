import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, Palette, ArrowUp, ArrowDown, Users, ChefHat } from "lucide-react";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMealAssignmentOpen, setIsMealAssignmentOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchMeals();
  }, []);

  useEffect(() => {
    applySearch();
  }, [categories, searchQuery]);

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

  const applySearch = () => {
    let filtered = categories;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = categories.filter(category =>
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
      fetchMeals(); // Refresh meals to update category assignments
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
    // Check if any meals use this category
    const { data: mealsWithCategory, error: mealsError } = await supabase
      .from("meals")
      .select("id, name")
      .eq("category", categories.find(c => c.id === id)?.name);

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
    return meals.filter(meal => meal.category === categoryName);
  };

  const getUnassignedMeals = () => {
    const categoryNames = categories.map(c => c.name);
    return meals.filter(meal => !categoryNames.includes(meal.category) || !meal.category);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      is_active: true
    });
    setEditingCategory(null);
  };

  const displayedCategories = (filteredCategories.length > 0 || searchQuery) ? filteredCategories : categories;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Categories Manager</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                Create or edit meal categories to organize your menu items.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
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
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 p-1 rounded"
                  />
                  <Badge style={{ backgroundColor: formData.color, color: '#fff' }}>
                    {formData.name || 'Category Preview'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Create"} Category
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Showing {displayedCategories.length} of {categories.length} categories</span>
              {searchQuery && (
                <span>Search: "{searchQuery}"</span>
              )}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Meals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <Badge style={{ backgroundColor: category.color, color: '#fff' }}>
                      {category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {category.description || (
                      <span className="text-muted-foreground italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: category.color }}
                      title={category.color}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => toggleActive(category)}
                      />
                      <span className="text-sm">
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getMealsInCategory(category.name).length} meals
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openMealAssignment(category)}
                        title="Manage meals in this category"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveCategory(category, 'up')}
                        disabled={categories.findIndex(c => c.id === category.id) === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveCategory(category, 'down')}
                        disabled={categories.findIndex(c => c.id === category.id) === categories.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                        title="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMealAssignment(category)}
                        title="Manage meals"
                      >
                        <ChefHat className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(category.id)}
                        title="Delete category"
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
          
          {selectedCategory && (
            <div className="space-y-6">
              {/* Current Meals in Category */}
              <div>
                <h4 className="font-medium mb-3">
                  Meals in {selectedCategory.name} ({getMealsInCategory(selectedCategory.name).length})
                </h4>
                <div className="border rounded-lg">
                  {getMealsInCategory(selectedCategory.name).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Meal Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Move to Category</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getMealsInCategory(selectedCategory.name).map((meal) => (
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
                              <Badge variant={meal.is_active ? "default" : "secondary"}>
                                {meal.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={meal.category}
                                onValueChange={(newCategory) => assignMealToCategory(meal.id, newCategory)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: cat.color }}
                                        />
                                        {cat.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => assignMealToCategory(meal.id, "uncategorized")}
                                title="Remove from category"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No meals in this category yet.</p>
                      <p className="text-sm">Add meals from the unassigned section below.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Meals to Add */}
              <div>
                <h4 className="font-medium mb-3">
                  Other Meals ({meals.filter(m => m.category !== selectedCategory.name).length})
                </h4>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {meals.filter(m => m.category !== selectedCategory.name).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Meal Name</TableHead>
                          <TableHead>Current Category</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meals.filter(m => m.category !== selectedCategory.name).map((meal) => (
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
                              {meal.category ? (
                                <Badge style={{ 
                                  backgroundColor: categories.find(c => c.name === meal.category)?.color || '#3b82f6',
                                  color: '#fff'
                                }}>
                                  {meal.category}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Unassigned</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => assignMealToCategory(meal.id, selectedCategory.name)}
                              >
                                Add to {selectedCategory.name}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>All meals are already in this category.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={() => setIsMealAssignmentOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManager;