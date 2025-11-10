import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Package2, Zap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GenericDataTable } from "@/components/common/GenericDataTable";
import { GenericFiltersBar } from "@/components/common/GenericFiltersBar";
import { StatsCardsGrid } from "@/components/common/StatsCards";
import { GenericModal } from "@/components/common/GenericModal";
import { useStandardizedIngredientsData, type Ingredient } from "@/hooks/useStandardizedIngredientsData";
import { logger } from "@/lib/logger";

interface Allergen {
  id: string;
  name: string;
  description?: string;
}

const IngredientsManager = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const {
    filteredIngredients,
    loading,
    stats,
    refetch
  } = useStandardizedIngredientsData({
    searchTerm: searchQuery,
    sortBy,
    sortOrder,
    filterBy: filterBy as any
  });

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    calories_per_100g: "",
    protein_per_100g: "",
    carbs_per_100g: "",
    fat_per_100g: "",
    saturated_fat_per_100g: "",
    fiber_per_100g: "",
    sugar_per_100g: "",
    salt_per_100g: "",
    default_unit: "g"
  });

  const fetchAllergens = useCallback(async () => {
    const { data, error } = await supabase
      .from("allergens")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to fetch allergens", variant: "destructive" });
    } else {
      setAllergens(data || []);
    }
  }, [toast]);

  // Load allergens on mount
  useEffect(() => {
    fetchAllergens();
  }, [fetchAllergens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ingredientData = {
      name: formData.name,
      description: formData.description,
      calories_per_100g: parseFloat(formData.calories_per_100g) || 0,
      protein_per_100g: parseFloat(formData.protein_per_100g) || 0,
      carbs_per_100g: parseFloat(formData.carbs_per_100g) || 0,
      fat_per_100g: parseFloat(formData.fat_per_100g) || 0,
      saturated_fat_per_100g: parseFloat(formData.saturated_fat_per_100g) || 0,
      fiber_per_100g: parseFloat(formData.fiber_per_100g) || 0,
      sugar_per_100g: parseFloat(formData.sugar_per_100g) || 0,
      salt_per_100g: parseFloat(formData.salt_per_100g) || 0,
      default_unit: formData.default_unit
    };

    let result;
    let ingredientId: string;

    if (editingIngredient) {
      result = await supabase
        .from("ingredients")
        .update(ingredientData)
        .eq("id", editingIngredient.id)
        .select();
      ingredientId = editingIngredient.id;
    } else {
      result = await supabase
        .from("ingredients")
        .insert([ingredientData])
        .select();
      ingredientId = result.data?.[0]?.id;
    }

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }

    // Handle allergen associations
    if (ingredientId) {
      await supabase
        .from("ingredient_allergens")
        .delete()
        .eq("ingredient_id", ingredientId);

      if (selectedAllergens.length > 0) {
        const allergenAssociations = selectedAllergens.map(allergenId => ({
          ingredient_id: ingredientId,
          allergen_id: allergenId
        }));

        const allergenResult = await supabase
          .from("ingredient_allergens")
          .insert(allergenAssociations);

        if (allergenResult.error) {
          toast({ title: "Warning", description: "Ingredient created but allergens could not be saved", variant: "destructive" });
        }
      }
    }

    toast({ title: "Success", description: `Ingredient ${editingIngredient ? 'updated' : 'created'} successfully` });
    await refetch();
    setIsModalOpen(false);
    resetForm();
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
      saturated_fat_per_100g: ingredient.saturated_fat_per_100g?.toString() || "0",
      fiber_per_100g: ingredient.fiber_per_100g.toString(),
      sugar_per_100g: ingredient.sugar_per_100g?.toString() || "0",
      salt_per_100g: ingredient.salt_per_100g?.toString() || "0",
      default_unit: ingredient.default_unit || "g"
    });
    setSelectedAllergens(ingredient.allergens?.map(a => a.id) || []);
    setIsModalOpen(true);
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
      refetch();
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
      saturated_fat_per_100g: "",
      fiber_per_100g: "",
      sugar_per_100g: "",
      salt_per_100g: "",
      default_unit: "g"
    });
    setSelectedAllergens([]);
    setEditingIngredient(null);
  };

  const handleAllergenToggle = (allergenId: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergenId)
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const statsData = [
    {
      id: "total-ingredients",
      title: "Total Ingredients",
      value: stats.total.toString(),
      subtitle: "Available ingredients",
      icon: Package2,
    },
    {
      id: "avg-calories", 
      title: "Avg Calories",
      value: stats.avgCalories.toString(),
      subtitle: "Per 100g average",
      icon: Zap,
    },
    {
      id: "high-protein",
      title: "High Protein",
      value: stats.highProtein.toString(),
      subtitle: "Over 15g protein per 100g",
      icon: Target,
    },
    {
      id: "with-allergens",
      title: "With Allergens",
      value: stats.withAllergens.toString(),
      subtitle: "Contain allergens",
      icon: Package2,
    },
  ];

  const tableColumns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (value: any, ingredient: Ingredient) => (
        <div>
          <div className="font-medium">{ingredient.name}</div>
          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
            {ingredient.description}
          </div>
        </div>
      ),
    },
    {
      key: "calories_per_100g",
      header: "Calories",
      sortable: true,
      cell: (value: any, ingredient: Ingredient) => `${ingredient.calories_per_100g}`,
    },
    {
      key: "protein_per_100g",
      header: "Protein",
      sortable: true,
      cell: (value: any, ingredient: Ingredient) => `${ingredient.protein_per_100g}g`,
    },
    {
      key: "carbs_per_100g",
      header: "Carbs",
      sortable: true,
      cell: (value: any, ingredient: Ingredient) => `${ingredient.carbs_per_100g}g`,
    },
    {
      key: "fat_per_100g",
      header: "Fat",
      sortable: true,
      cell: (value: any, ingredient: Ingredient) => `${ingredient.fat_per_100g}g`,
    },
    {
      key: "allergens",
      header: "Allergens",
      cell: (value: any, ingredient: Ingredient) => (
        <div className="flex flex-wrap gap-1">
          {ingredient.allergens?.slice(0, 2).map((allergen) => (
            <Badge key={allergen.id} variant="secondary" className="text-xs">
              {allergen.name}
            </Badge>
          ))}
          {ingredient.allergens && ingredient.allergens.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{ingredient.allergens.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  const ingredientActions = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (ingredient: Ingredient) => handleEdit(ingredient),
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (ingredient: Ingredient) => handleDelete(ingredient.id),
      variant: "destructive" as const,
    },
  ];

  const filterOptions = [
    { value: "all", label: "All Ingredients" },
    { value: "high-protein", label: "High Protein (>15g)" },
    { value: "low-calorie", label: "Low Calorie (<100)" },
    { value: "with-allergens", label: "With Allergens" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Package2 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Ingredients Database</h2>
            <p className="text-muted-foreground">Manage nutritional data for all ingredients</p>
          </div>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCardsGrid stats={statsData} />

      {/* Filters and Table */}
      <GenericFiltersBar
        filters={{ searchTerm: searchQuery, sortBy, sortOrder, viewMode: "list" as const }}
        onFiltersChange={(newFilters) => {
          if (newFilters.searchTerm !== undefined) setSearchQuery(newFilters.searchTerm);
          if (newFilters.sortBy !== undefined) setSortBy(newFilters.sortBy);
          if (newFilters.sortOrder !== undefined) setSortOrder(newFilters.sortOrder);
        }}
        totalCount={stats.total}
        filteredCount={stats.filtered}
        entityName="ingredient"
        entityNamePlural="ingredients"
        customFilters={filterOptions}
        customFilterValue={filterBy}
        onCustomFilterChange={setFilterBy}
        exportLabel="Export Ingredients"
      />

      <GenericDataTable
        data={filteredIngredients}
        columns={tableColumns}
        actions={ingredientActions}
        loading={loading}
        emptyMessage="No ingredients found matching your filters."
      />

      {/* Add/Edit Modal */}
      <GenericModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="saturated_fat">Saturated Fat per 100g</Label>
              <Input
                id="saturated_fat"
                type="number"
                step="0.01"
                value={formData.saturated_fat_per_100g}
                onChange={(e) => setFormData({ ...formData, saturated_fat_per_100g: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="sugar">Sugar per 100g</Label>
              <Input
                id="sugar"
                type="number"
                step="0.01"
                value={formData.sugar_per_100g}
                onChange={(e) => setFormData({ ...formData, sugar_per_100g: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salt">Salt per 100g</Label>
              <Input
                id="salt"
                type="number"
                step="0.01"
                value={formData.salt_per_100g}
                onChange={(e) => setFormData({ ...formData, salt_per_100g: e.target.value })}
              />
            </div>
          </div>

          {/* Allergens Section */}
          <div className="space-y-3">
            <Label>Allergens</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {allergens.map((allergen) => (
                <div key={allergen.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`allergen-${allergen.id}`}
                    checked={selectedAllergens.includes(allergen.id)}
                    onCheckedChange={() => handleAllergenToggle(allergen.id)}
                  />
                  <Label 
                    htmlFor={`allergen-${allergen.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {allergen.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedAllergens.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedAllergens.map(allergenId => {
                  const allergen = allergens.find(a => a.id === allergenId);
                  return allergen ? (
                    <Badge key={allergenId} variant="secondary" className="text-xs">
                      {allergen.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {editingIngredient ? "Update" : "Create"} Ingredient
            </Button>
          </div>
        </form>
      </GenericModal>
    </div>
  );
};

export default IngredientsManager;