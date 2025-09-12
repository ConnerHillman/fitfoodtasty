import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MealData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  ingredients: string[];
  allergens: string[];
}

interface MealSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal: (meal: MealData) => void;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
}

export const MealSelector: React.FC<MealSelectorProps> = ({ isOpen, onClose, onSelectMeal }) => {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchMealsAndCategories();
    }
  }, [isOpen]);

  const fetchMealsAndCategories = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch meals with their ingredients and allergens
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select(`
          id,
          name,
          description,
          category,
          total_calories,
          total_protein,
          total_fat,
          total_carbs,
          meal_ingredients (
            quantity,
            unit,
            ingredients (
              name
            )
          ),
          meal_allergens (
            allergens (
              name
            )
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (mealsError) throw mealsError;

      // Process meals data
      const processedMeals: MealData[] = mealsData?.map(meal => ({
        id: meal.id,
        name: meal.name,
        description: meal.description,
        category: meal.category,
        total_calories: meal.total_calories || 0,
        total_protein: meal.total_protein || 0,
        total_fat: meal.total_fat || 0,
        total_carbs: meal.total_carbs || 0,
        ingredients: meal.meal_ingredients?.map((mi: any) => 
          `${mi.ingredients.name} (${mi.quantity}${mi.unit})`
        ) || [],
        allergens: meal.meal_allergens?.map((ma: any) => ma.allergens.name) || []
      })) || [];

      setCategories(categoriesData || []);
      setMeals(processedMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
      toast.error('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMeal = (meal: MealData) => {
    onSelectMeal(meal);
    onClose();
    toast.success(`${meal.name} selected`);
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || meal.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedMeals = categories.reduce((acc, category) => {
    acc[category.name] = filteredMeals.filter(meal => meal.category === category.name);
    return acc;
  }, {} as Record<string, MealData[]>);

  // Add uncategorized meals
  const uncategorizedMeals = filteredMeals.filter(meal => 
    !meal.category || !categories.some(cat => cat.name === meal.category)
  );
  if (uncategorizedMeals.length > 0) {
    groupedMeals['Uncategorized'] = uncategorizedMeals;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Meal from Menu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading meals...</span>
            </div>
          ) : (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 overflow-hidden">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length + 1}, 1fr)` }}>
                <TabsTrigger value="all">All ({meals.length})</TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger key={category.id} value={category.name}>
                    {category.name} ({groupedMeals[category.name]?.length || 0})
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-4 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMeals.map(meal => (
                    <MealCard key={meal.id} meal={meal} onSelect={handleSelectMeal} />
                  ))}
                </div>
              </TabsContent>

              {categories.map(category => (
                <TabsContent key={category.id} value={category.name} className="mt-4 overflow-y-auto max-h-[60vh]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedMeals[category.name]?.map(meal => (
                      <MealCard key={meal.id} meal={meal} onSelect={handleSelectMeal} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {!loading && filteredMeals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No meals found matching your search criteria.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface MealCardProps {
  meal: MealData;
  onSelect: (meal: MealData) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onSelect }) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(meal)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{meal.name}</CardTitle>
        {meal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{meal.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Nutrition Info */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between">
            <span>Calories:</span>
            <span className="font-medium">{meal.total_calories}</span>
          </div>
          <div className="flex justify-between">
            <span>Protein:</span>
            <span className="font-medium">{meal.total_protein}g</span>
          </div>
          <div className="flex justify-between">
            <span>Fat:</span>
            <span className="font-medium">{meal.total_fat}g</span>
          </div>
          <div className="flex justify-between">
            <span>Carbs:</span>
            <span className="font-medium">{meal.total_carbs}g</span>
          </div>
        </div>

        {/* Allergens */}
        {meal.allergens.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium">Allergens:</span>
            <div className="flex flex-wrap gap-1">
              {meal.allergens.slice(0, 3).map(allergen => (
                <Badge key={allergen} variant="destructive" className="text-xs">
                  {allergen}
                </Badge>
              ))}
              {meal.allergens.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{meal.allergens.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button size="sm" className="w-full mt-2">
          Select Meal
        </Button>
      </CardContent>
    </Card>
  );
};