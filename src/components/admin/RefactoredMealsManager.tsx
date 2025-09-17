import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, FlaskConical, FileText, Calculator, Edit, ImageIcon, Eye, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStandardizedMealsData } from "@/hooks/useStandardizedMealsData";
import { formatCurrency } from "@/lib/utils";

// Import new admin components
import { 
  AdminLayout, 
  AdminTable, 
  AdminStatsGrid, 
  AdminFormModal, 
  AdminTabsLayout 
} from "./common";
import type { ColumnDef, ActionItem, StatCard, TabConfig } from "./common";

// Import existing components
import { MealGridView } from "./meals/MealGridView";
import MealFormWithIngredients from "./MealFormWithIngredients";
import MealBuilder from "./MealBuilder";
import MealAnalytics from "./MealAnalytics";
import MealDetailModal from "./MealDetailModal";
import CategoryTag from "@/components/CategoryTag";

import type { Meal, MealFilters } from "@/types/meal";

const RefactoredMealsManager = () => {
  const { toast } = useToast();
  
  // Filter state
  const [filters, setFilters] = useState<MealFilters>({
    searchTerm: "",
    sortBy: 'created_at',
    sortOrder: 'desc',
    statusFilter: 'active',
    categoryFilter: 'all',
    viewMode: 'list'
  });

  // Dialog states
  const [isNewMealFormOpen, setIsNewMealFormOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  // Use the standardized data hook
  const {
    meals: filteredMeals,
    allMeals: meals,
    categories,
    loading,
    error,
    pagination,
    totalPages,
    createMeal,
    updateMeal,
    deleteMeal,
    toggleMealActive,
    refetch,
    invalidateCache
  } = useStandardizedMealsData(filters);

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

  const handleToggleMeal = async (meal: Meal) => {
    await toggleMealActive(meal);
  };

  // Stats data for AdminStatsGrid
  const statsData: StatCard[] = useMemo(() => {
    const activeMeals = meals.filter(m => m.is_active);
    const inactiveMeals = meals.filter(m => !m.is_active);
    const avgPrice = meals.reduce((sum, m) => sum + (m.price || 0), 0) / meals.length || 0;
    const avgCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0) / meals.length || 0;

    return [
      {
        id: 'total',
        title: 'Total Meals',
        value: meals.length,
        icon: FlaskConical,
        iconColor: 'text-blue-500'
      },
      {
        id: 'active',
        title: 'Active Meals',
        value: activeMeals.length,
        icon: Power,
        iconColor: 'text-green-500',
        subtitle: `${inactiveMeals.length} inactive`
      },
      {
        id: 'avg_price',
        title: 'Average Price',
        value: formatCurrency(avgPrice),
        icon: Calculator,
        iconColor: 'text-emerald-500'
      },
      {
        id: 'avg_calories',
        title: 'Average Calories',
        value: Math.round(avgCalories),
        subtitle: 'per meal',
        icon: BarChart3,
        iconColor: 'text-orange-500'
      }
    ];
  }, [meals]);

  // Table columns
  const columns: ColumnDef<Meal>[] = [
    {
      key: 'image_url',
      header: 'Image',
      width: '60px',
      accessor: (meal) => (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted flex items-center justify-center">
          {meal.image_url ? (
            <img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Name',
      accessor: (meal) => (
        <div>
          <div className="font-medium">{meal.name}</div>
          {meal.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">{meal.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (meal) => <CategoryTag category={meal.category} />
    },
    {
      key: 'price',
      header: 'Price',
      cell: (value: number) => formatCurrency(value || 0),
      className: 'text-right'
    },
    {
      key: 'total_calories',
      header: 'Calories',
      cell: (value: number) => `${Math.round(value || 0)} kcal`,
      className: 'text-right'
    },
    {
      key: 'total_protein',
      header: 'Protein',
      cell: (value: number) => `${(value || 0).toFixed(1)}g`,
      className: 'text-right'
    },
    {
      key: 'is_active',
      header: 'Status',
      accessor: (meal) => (
        <Badge variant={meal.is_active ? "default" : "secondary"}>
          {meal.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    }
  ];

  // Table actions
  const actions: ActionItem<Meal>[] = [
    {
      label: 'View',
      icon: Eye,
      onClick: (meal) => handleViewMeal(meal.id),
      variant: 'outline'
    },
    {
      label: 'Build',
      icon: Calculator,
      onClick: (meal) => handleBuildMeal(meal.id),
      variant: 'outline'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: (meal) => handleEditMeal(meal.id),
      variant: 'outline'
    },
    {
      label: 'Toggle Status',
      icon: Power,
      onClick: handleToggleMeal,
      variant: 'outline'
    }
  ];

  const handleFormSuccess = async (mealData: any) => {
    await createMeal(mealData);
    setIsNewMealFormOpen(false);
  };

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      value: 'management',
      label: 'Meal Management',
      icon: FlaskConical,
      content: (
        <div className="space-y-6">
          {/* Stats Grid */}
          <AdminStatsGrid 
            stats={statsData} 
            loading={loading} 
            columns={4} 
          />

          {/* Meals Table */}
          {filters.viewMode === 'list' ? (
            <AdminTable
              title="Meals"
              data={filteredMeals}
              columns={columns}
              actions={actions}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search meals by name, description, or category..."
              onRefresh={refetch}
              onExport={() => toast({ title: "Export", description: "Export functionality coming soon" })}
              emptyMessage="No meals found"
              emptyDescription="Get started by creating your first meal"
            />
          ) : (
            <MealGridView
              meals={filteredMeals}
              onToggleActive={handleToggleMeal}
              onViewMeal={handleViewMeal}
              onBuildMeal={handleBuildMeal}
              onEditMeal={handleEditMeal}
            />
          )}
        </div>
      )
    },
    {
      value: 'analytics',
      label: 'Analytics & Insights',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
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
        </div>
      )
    }
  ];

  return (
    <AdminLayout
      title="Meal Management"
      description="Manage your meal offerings, nutrition, and ingredients"
      icon={FlaskConical}
      primaryAction={{
        label: "Add Meal",
        onClick: () => setIsNewMealFormOpen(true),
        icon: Plus
      }}
    >
      <AdminTabsLayout tabs={tabs} defaultValue="management" />

      {/* New Meal Form Modal */}
      <AdminFormModal
        open={isNewMealFormOpen}
        onOpenChange={setIsNewMealFormOpen}
        title="Add New Meal"
        description="Create a new meal with ingredients and nutritional information."
        size="4xl"
      >
        <MealFormWithIngredients
          onSuccess={() => {
            handleFormSuccess({});
          }}
          onCancel={() => setIsNewMealFormOpen(false)}
        />
      </AdminFormModal>

      {/* Builder Modal */}
      <AdminFormModal
        open={isBuilderOpen && !!selectedMealId}
        onOpenChange={setIsBuilderOpen}
        title="Build Meal Nutrition"
        description="Adjust ingredients and quantities to update nutrition in real time."
        size="5xl"
      >
        {selectedMealId && (
          <MealBuilder
            mealId={selectedMealId}
            onClose={() => setIsBuilderOpen(false)}
            onNutritionUpdate={refetch}
          />
        )}
      </AdminFormModal>

      {/* Meal Detail Modal */}
      <MealDetailModal
        mealId={selectedMealId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMealId(null);
        }}
        onUpdate={refetch}
      />
    </AdminLayout>
  );
};

export default RefactoredMealsManager;