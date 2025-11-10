import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, ArrowUp, ArrowDown, ChefHat, Grid, List, MoreVertical, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CategoryTag from "../CategoryTag";
import { useStandardizedCategoriesData } from "@/hooks/useStandardizedCategoriesData";

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

const CategoriesManager = () => {
  const {
    categories,
    allCategories,
    meals,
    loading,
    stats,
    filters,
    setFilters,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    moveCategory,
    assignMealToCategory,
    getMealsInCategory,
    getUnassignedMeals
  } = useStandardizedCategoriesData();

  const [mealSearchQuery, setMealSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      name: formData.name.toLowerCase().trim(),
      description: formData.description,
      color: formData.color,
      is_active: formData.is_active
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData);
    } else {
      await createCategory(categoryData);
    }

    setIsDialogOpen(false);
    resetForm();
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

  const openMealAssignment = (category: Category) => {
    setSelectedCategory(category);
    setMealSearchQuery("");
    setIsMealAssignmentOpen(true);
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

  const getMealsInCategoryFiltered = (categoryName: string) => {
    const mealsInCategory = getMealsInCategory(categoryName);
    if (!mealSearchQuery.trim()) return mealsInCategory;
    
    const query = mealSearchQuery.toLowerCase().trim();
    return mealsInCategory.filter(meal =>
      meal.name.toLowerCase().includes(query) ||
      (meal.description && meal.description.toLowerCase().includes(query))
    );
  };

  const getUnassignedMealsFiltered = () => {
    const unassignedMeals = getUnassignedMeals();
    if (!mealSearchQuery.trim()) return unassignedMeals;
    
    const query = mealSearchQuery.toLowerCase().trim();
    return unassignedMeals.filter(meal =>
      meal.name.toLowerCase().includes(query) ||
      (meal.description && meal.description.toLowerCase().includes(query))
    );
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card className={`group transition-all duration-200 hover:shadow-md hover:scale-105 border-2 ${!category.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <CategoryTag 
              category={category.name} 
              size="sm" 
              variant="bold" 
              className="shadow-md"
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
                  <DropdownMenuItem onClick={() => toggleCategory(category.id)}>
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
                    onClick={() => deleteCategory(category.id)}
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
              {getMealsInCategory(category.name).length} meals
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveCategory(category, 'up')}
              disabled={allCategories.findIndex(c => c.id === category.id) === 0}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveCategory(category, 'down')}
              disabled={allCategories.findIndex(c => c.id === category.id) === allCategories.length - 1}
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
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Categories Manager</h2>
              <p className="text-muted-foreground">Create and manage meal categories to organize your menu</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60"></div>
                  {stats.total} categories
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  {stats.active} active
                </span>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., breakfast, lunch, dessert"
                      className="h-12 border-2 focus:border-primary/50"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe this category..."
                      className="border-2 focus:border-primary/50 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="color" className="text-base font-semibold">Brand Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-12 p-1 rounded-lg border-2"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <CategoryTag 
                          category={formData.name || 'Category Preview'} 
                          size="sm" 
                          variant="bold"
                        />
                        <span className="text-sm text-muted-foreground">
                          Live Preview
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="font-medium">Active Category</Label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-primary to-primary/80 shadow-lg">
                      {editingCategory ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="pl-10 w-[280px]"
            />
          </div>

          {/* Show inactive toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={filters.showInactive}
              onCheckedChange={(checked) => setFilters({ ...filters, showInactive: checked })}
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
              <ChefHat className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Categories</p>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.active}</p>
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
                <p className="text-2xl font-bold">{stats.totalMeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid/List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.searchTerm ? "Try adjusting your search criteria" : "Get started by creating your first category"}
            </p>
            {!filters.searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unassigned Meals Section */}
          {getUnassignedMeals().length > 0 && (
            <Card className="border-2 border-dashed border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <ChefHat className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                        Unassigned Meals
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        Requires attention
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory({ 
                        id: 'unassigned', 
                        name: 'unassigned', 
                        description: 'Unassigned meals', 
                        color: '#f97316', 
                        is_active: true, 
                        sort_order: -1,
                        created_at: new Date().toISOString()
                      });
                      setIsMealAssignmentOpen(true);
                    }}
                    className="border-orange-200 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                  These meals need to be assigned to a category to appear in the menu properly.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300">
                    {getUnassignedMeals().length} unassigned meals
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          <div className={`animate-fade-in ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {categories.map((category) => (
            <div key={category.id}>
              {viewMode === 'grid' ? (
                <CategoryCard category={category} />
              ) : (
                <Card className="group transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-4">
                         <CategoryTag 
                           category={category.name}
                           size="sm"
                           variant="bold"
                           className="shadow-sm"
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
                           {getMealsInCategory(category.name).length} meals
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
                            <DropdownMenuItem onClick={() => toggleCategory(category.id)}>
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
                              onClick={() => deleteCategory(category.id)}
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
        </div>
      )}

      {/* Meal Assignment Dialog */}
      <Dialog open={isMealAssignmentOpen} onOpenChange={setIsMealAssignmentOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {selectedCategory?.name === 'unassigned' ? 
                'Manage Unassigned Meals' : 
                `Manage Meals in "${selectedCategory?.name}" Category`
              }
            </DialogTitle>
            <DialogDescription>
              {selectedCategory?.name === 'unassigned' ? 
                'Assign these meals to appropriate categories to organize your menu.' :
                'Add or remove meals from this category. You can also move meals to other categories.'
              }
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
            {selectedCategory?.name !== 'unassigned' && (
              <div>
                 <h4 className="font-semibold mb-3 flex items-center justify-between">
                   <span>Current Meals</span>
                   <Badge variant="outline">
                     {mealSearchQuery ? 
                       `${getMealsInCategoryFiltered(selectedCategory?.name || '').length} of ${getMealsInCategory(selectedCategory?.name || '').length}` :
                       getMealsInCategory(selectedCategory?.name || '').length
                     }
                   </Badge>
                 </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {getMealsInCategoryFiltered(selectedCategory?.name || '').map((meal) => (
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
                 {getMealsInCategoryFiltered(selectedCategory?.name || '').length === 0 && (
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
            )}

            {/* Unassigned meals */}
            <div>
               <h4 className="font-semibold mb-3 flex items-center justify-between">
                 <span>Unassigned Meals</span>
                 <Badge variant="outline">
                   {mealSearchQuery ? 
                     `${getUnassignedMealsFiltered().length} of ${getUnassignedMeals().length}` :
                     getUnassignedMeals().length
                   }
                 </Badge>
               </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getUnassignedMealsFiltered().map((meal) => (
                   <Card key={meal.id} className="p-3 hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between">
                       <div className="flex-1 min-w-0">
                         <h5 className="font-medium truncate">{meal.name}</h5>
                         <p className="text-sm text-muted-foreground line-clamp-1">{meal.description}</p>
                       </div>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button size="sm" className="shrink-0">
                             Assign Category
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           {allCategories.filter(c => c.is_active).map((category) => (
                             <DropdownMenuItem
                               key={category.id}
                               onClick={() => assignMealToCategory(meal.id, category.name)}
                             >
                               Assign to {category.name}
                             </DropdownMenuItem>
                           ))}
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </div>
                   </Card>
                 ))}
                 {getUnassignedMealsFiltered().length === 0 && (
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