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
import { Plus, Edit, Trash2, Eye, Calculator } from "lucide-react";
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