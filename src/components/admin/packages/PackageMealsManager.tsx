import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Package {
  id: string;
  name: string;
  meal_count: number;
}

interface Meal {
  id: string;
  name: string;
  category?: string;
  is_active: boolean;
  price?: number;
}

interface PackageMealsManagerProps {
  package: Package;
  onSuccess: () => void;
  onCancel: () => void;
}

const PackageMealsManager = ({ package: pkg, onSuccess, onCancel }: PackageMealsManagerProps) => {
  const { toast } = useToast();
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealsAndSelections();
  }, [pkg.id]);

  const fetchMealsAndSelections = async () => {
    try {
      // Fetch all available meals
      const { data: meals, error: mealsError } = await supabase
        .from("meals")
        .select("id, name, category, is_active, price")
        .eq("is_active", true)
        .order("name");

      if (mealsError) throw mealsError;

      // Fetch current package meals
      const { data: currentPackageMeals, error: packageMealsError } = await supabase
        .from("package_meals")
        .select("meal_id")
        .eq("package_id", pkg.id);

      if (packageMealsError) throw packageMealsError;

      setAvailableMeals(meals || []);
      setSelectedMealIds(currentPackageMeals?.map(pm => pm.meal_id) || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch meals", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMealToggle = (mealId: string) => {
    setSelectedMealIds(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Delete existing package meals
      await supabase
        .from("package_meals")
        .delete()
        .eq("package_id", pkg.id);

      // Insert new package meals
      if (selectedMealIds.length > 0) {
        const packageMealData = selectedMealIds.map(mealId => ({
          package_id: pkg.id,
          meal_id: mealId
        }));

        const { error } = await supabase
          .from("package_meals")
          .insert(packageMealData);

        if (error) throw error;
      }

      toast({ 
        title: "Success", 
        description: `Updated meals for ${pkg.name}` 
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving meal selections:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save meal selections", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMeals = availableMeals.filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meal.category && meal.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && availableMeals.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading meals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Available Meals for {pkg.name}</h3>
        <p className="text-sm text-muted-foreground">
          Select meals that customers can choose from for this package. 
          Selected: {selectedMealIds.length} meals
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meals by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Meals Grid */}
      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeals.map((meal) => (
            <Card 
              key={meal.id} 
              className={`cursor-pointer transition-colors ${
                selectedMealIds.includes(meal.id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleMealToggle(meal.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedMealIds.includes(meal.id)}
                        onChange={() => handleMealToggle(meal.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <h4 className="font-medium">{meal.name}</h4>
                        {meal.category && (
                          <Badge variant="secondary" className="mt-1">
                            {meal.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {meal.price && (
                    <div className="text-sm font-medium">
                      £{meal.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredMeals.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No meals found matching your search.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Meal Selections"}
        </Button>
      </div>
    </div>
  );
};

export default PackageMealsManager;