import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, BarChart3, FlaskConical, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMealsData } from "@/hooks/useMealsData";
import { useFilteredMeals } from "@/hooks/useFilteredMeals";
import { MealFiltersBar } from "./meals/MealFiltersBar";
import { MealGridView } from "./meals/MealGridView";
import MealFormWithIngredients from "./MealFormWithIngredients";
import MealBuilder from "./MealBuilder";
import MealAnalytics from "./MealAnalytics";
import MealDetailModal from "./MealDetailModal";
import type { MealFilters } from "@/types/meal";

const MealsManager = () => {
  const { toast } = useToast();
  const { meals, categories, loading, fetchMeals, toggleMealActive } = useMealsData();
  
  // Filter state
  const [filters, setFilters] = useState<MealFilters>({
    searchQuery: "",
    statusFilter: 'active',
    categoryFilter: 'all',
    viewMode: 'list'
  });

  // Dialog states
  const [isNewMealFormOpen, setIsNewMealFormOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  const filteredMeals = useFilteredMeals(meals, filters);

  const handleFiltersChange = (newFilters: Partial<MealFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleViewMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setIsDetailModalOpen(true);
  };

  const handleBuildMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setIsBuilderOpen(true);
  };

  const handleEditMeal = (mealId: string) => {
    toast({
      title: "Coming Soon",
      description: "Meal editing feature is being developed",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meals Management</h1>
          <p className="text-muted-foreground">
            Manage your meal offerings, nutrition, and ingredients
          </p>
        </div>
        <Button onClick={() => setIsNewMealFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      <Tabs defaultValue="meals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-6">
          <MealFiltersBar
            filters={filters}
            categories={categories}
            onFiltersChange={handleFiltersChange}
            totalCount={meals.length}
            filteredCount={filteredMeals.length}
          />

          {filteredMeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No meals found matching your filters.</p>
            </div>
          ) : (
            <MealGridView
              meals={filteredMeals}
              onToggleActive={toggleMealActive}
              onViewMeal={handleViewMeal}
              onBuildMeal={handleBuildMeal}
              onEditMeal={handleEditMeal}
            />
          )}

          {/* New Meal Form Dialog */}
          <Dialog open={isNewMealFormOpen} onOpenChange={setIsNewMealFormOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Meal</DialogTitle>
                <DialogDescription>Create a new meal with ingredients and nutritional information.</DialogDescription>
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

          {/* Builder Dialog */}
          <Dialog open={isBuilderOpen && !!selectedMealId} onOpenChange={setIsBuilderOpen}>
            <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Build Meal Nutrition</DialogTitle>
                <DialogDescription>Adjust ingredients and quantities to update nutrition in real time.</DialogDescription>
              </DialogHeader>
              {selectedMealId && (
                <MealBuilder
                  mealId={selectedMealId}
                  onClose={() => setIsBuilderOpen(false)}
                  onNutritionUpdate={() => fetchMeals()}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">Deep dive into meal performance and generate reports</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Ingredient analysis feature is being developed",
                  });
                }}
                className="flex items-center gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                Analyze Ingredients
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "Coming Soon", 
                    description: "Report export feature is being developed",
                  });
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          <MealAnalytics />
        </TabsContent>
      </Tabs>

      {/* Meal Detail Modal */}
      <MealDetailModal
        mealId={selectedMealId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMealId(null);
        }}
        onUpdate={fetchMeals}
      />
    </div>
  );
};

export default MealsManager;