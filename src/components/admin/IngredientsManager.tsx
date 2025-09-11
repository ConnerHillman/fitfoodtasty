import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  description: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  default_unit: string;
}

const IngredientsManager = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    calories_per_100g: "",
    protein_per_100g: "",
    carbs_per_100g: "",
    fat_per_100g: "",
    fiber_per_100g: "",
    default_unit: "g"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    applySearch();
  }, [ingredients, searchQuery]);

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch ingredients", variant: "destructive" });
    } else {
      setIngredients(data || []);
    }
  };

  const applySearch = () => {
    let filtered = ingredients;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(query) ||
        (ingredient.description && ingredient.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredIngredients(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ingredientData = {
      name: formData.name,
      description: formData.description,
      calories_per_100g: parseFloat(formData.calories_per_100g) || 0,
      protein_per_100g: parseFloat(formData.protein_per_100g) || 0,
      carbs_per_100g: parseFloat(formData.carbs_per_100g) || 0,
      fat_per_100g: parseFloat(formData.fat_per_100g) || 0,
      fiber_per_100g: parseFloat(formData.fiber_per_100g) || 0,
      default_unit: formData.default_unit
    };

    let result;
    if (editingIngredient) {
      result = await supabase
        .from("ingredients")
        .update(ingredientData)
        .eq("id", editingIngredient.id);
    } else {
      result = await supabase
        .from("ingredients")
        .insert([ingredientData]);
    }

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Ingredient ${editingIngredient ? 'updated' : 'created'} successfully` });
      setIsDialogOpen(false);
      resetForm();
      fetchIngredients();
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      description: ingredient.description || "",
      calories_per_100g: ingredient.calories_per_100g.toString(),
      protein_per_100g: ingredient.protein_per_100g.toString(),
      carbs_per_100g: ingredient.carbs_per_100g.toString(),
      fat_per_100g: ingredient.fat_per_100g.toString(),
      fiber_per_100g: ingredient.fiber_per_100g.toString(),
      default_unit: ingredient.default_unit || "g"
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ingredient deleted successfully" });
      fetchIngredients();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      calories_per_100g: "",
      protein_per_100g: "",
      carbs_per_100g: "",
      fat_per_100g: "",
      fiber_per_100g: "",
      default_unit: "g"
    });
    setEditingIngredient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Ingredients Database</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
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
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="unit">Default Unit</Label>
                  <Input
                    id="unit"
                    value={formData.default_unit}
                    onChange={(e) => setFormData({ ...formData, default_unit: e.target.value })}
                    placeholder="g, ml, piece"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories per 100g</Label>
                  <Input
                    id="calories"
                    type="number"
                    step="0.01"
                    value={formData.calories_per_100g}
                    onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein per 100g</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.01"
                    value={formData.protein_per_100g}
                    onChange={(e) => setFormData({ ...formData, protein_per_100g: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs per 100g</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.01"
                    value={formData.carbs_per_100g}
                    onChange={(e) => setFormData({ ...formData, carbs_per_100g: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat per 100g</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.01"
                    value={formData.fat_per_100g}
                    onChange={(e) => setFormData({ ...formData, fat_per_100g: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiber">Fiber per 100g</Label>
                  <Input
                    id="fiber"
                    type="number"
                    step="0.01"
                    value={formData.fiber_per_100g}
                    onChange={(e) => setFormData({ ...formData, fiber_per_100g: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIngredient ? "Update" : "Create"} Ingredient
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
              <span>Showing {(filteredIngredients.length > 0 || searchQuery) ? filteredIngredients.length : ingredients.length} of {ingredients.length} ingredients</span>
              {searchQuery && (
                <span>Search: "{searchQuery}"</span>
              )}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Protein</TableHead>
                <TableHead>Carbs</TableHead>
                <TableHead>Fat</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {((filteredIngredients.length > 0 || searchQuery) ? filteredIngredients : ingredients).map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{ingredient.name}</div>
                      {ingredient.description && (
                        <div className="text-sm text-muted-foreground">{ingredient.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{ingredient.calories_per_100g}kcal</TableCell>
                  <TableCell>{ingredient.protein_per_100g}g</TableCell>
                  <TableCell>{ingredient.carbs_per_100g}g</TableCell>
                  <TableCell>{ingredient.fat_per_100g}g</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ingredient.default_unit}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(ingredient)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(ingredient.id)}
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
    </div>
  );
};

export default IngredientsManager;