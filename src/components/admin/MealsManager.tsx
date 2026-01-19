import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, FlaskConical, FileText, Calculator, Edit, ImageIcon, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStandardizedMealsData } from "@/hooks/useStandardizedMealsData";
import { formatCurrency } from "@/lib/utils";

// Import new generic components
import { GenericFiltersBar, StatsCardsGrid, GenericDataTable, GenericModal, ClickableStatusBadge } from "@/components/common";

// Import existing components
import { MealGridView } from "./meals/MealGridView";
import MealFormWithIngredients from "./MealFormWithIngredients";
import MealBuilder from "./MealBuilder";
import MealAnalytics from "./MealAnalytics";
import MealDetailModal from "./MealDetailModal";
import CategoryTag from "@/components/CategoryTag";

import type { Meal, MealFilters } from "@/types/meal";
import type { StatCardData, ColumnDef, ActionItem } from "@/components/common";

const MealsManager = () => {
  const { toast } = useToast();
  
  // Filter state
  const [filters, setFilters] = useState<MealFilters>({
    searchQuery: "",
    statusFilter: 'active',
    categoryFilter: 'all',
    viewMode: 'list',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Use standardized hook with built-in filtering and pagination
  const {
    allMeals,
    categories,
    loading,
    error,
    toggleMealActive,
    refetch
  } = useStandardizedMealsData({
    searchTerm: filters.searchQuery,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    statusFilter: filters.statusFilter,
    categoryFilter: filters.categoryFilter,
    viewMode: filters.viewMode
  });

  // Dialog states
  const [isNewMealFormOpen, setIsNewMealFormOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  // Use allMeals for display (already filtered by the standardized hook)
  const filteredMeals = allMeals;

  // Convert filters to match GenericFiltersBar interface
  const genericFilters = useMemo(() => ({
    searchTerm: filters.searchQuery,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    viewMode: filters.viewMode
  }), [filters]);

  const handleFiltersChange = (newFilters: any) => {
    const updatedFilters: Partial<MealFilters> = {};
    
    if ('searchTerm' in newFilters) {
      updatedFilters.searchQuery = newFilters.searchTerm;
    }
    if ('sortBy' in newFilters) {
      updatedFilters.sortBy = newFilters.sortBy;
    }
    if ('sortOrder' in newFilters) {
      updatedFilters.sortOrder = newFilters.sortOrder;
    }
    if ('viewMode' in newFilters) {
      updatedFilters.viewMode = newFilters.viewMode;
    }
    
    setFilters(prev => ({ ...prev, ...updatedFilters }));
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

  // Stats data for the new StatsCardsGrid
  const statsData: StatCardData[] = useMemo(() => {
    const activeMeals = allMeals.filter(m => m.is_active);
    const inactiveMeals = allMeals.filter(m => !m.is_active);
    const avgPrice = allMeals.reduce((sum, m) => sum + (m.price || 0), 0) / allMeals.length || 0;
    const avgCalories = allMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0) / allMeals.length || 0;

    return [
      {
        id: 'total',
        title: 'Total Meals',
        value: allMeals.length,
        icon: FlaskConical,
        iconColor: 'text-blue-500'
      },
      {
        id: 'active',
        title: 'Active Meals',
        value: activeMeals.length,
        icon: CheckCircle,
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
  }, [allMeals]);

  // Table columns for the new GenericDataTable
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
        <ClickableStatusBadge
          item={meal}
          isActive={meal.is_active ?? false}
          itemName={meal.name}
          onToggle={toggleMealActive}
        />
      )
    }
  ];

  // Table actions for the new GenericDataTable
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
  ];

  // Filter options for GenericFiltersBar
  const categoryFilterOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'total_calories', label: 'Calories' },
    { value: 'category', label: 'Category' }
  ];

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
          {/* Stats Cards using new component */}
          <StatsCardsGrid 
            stats={statsData}
            columns={4}
            loading={loading}
          />

          {/* Filters using new GenericFiltersBar */}
          <GenericFiltersBar
            filters={genericFilters}
            onFiltersChange={handleFiltersChange}
            totalCount={allMeals.length}
            filteredCount={filteredMeals.length}
            searchPlaceholder="Search meals by name, description, or category..."
            customFilters={[
              ...statusFilterOptions,
              ...categoryFilterOptions
            ]}
            customFilterValue={filters.statusFilter}
            onCustomFilterChange={(value) => {
              if (['all', 'active', 'inactive'].includes(value)) {
                setFilters(prev => ({ ...prev, statusFilter: value as any }));
              } else {
                setFilters(prev => ({ ...prev, categoryFilter: value }));
              }
            }}
            sortOptions={sortOptions}
            viewModes={['list', 'grid']}
            onExport={() => toast({ title: "Export", description: "Export functionality coming soon" })}
            entityName="meal"
            entityNamePlural="meals"
          />

          {/* Conditional rendering based on view mode */}
          {filters.viewMode === 'list' ? (
            <GenericDataTable
              data={filteredMeals}
              columns={columns}
              actions={actions}
              loading={loading}
              getRowId={(meal) => meal.id}
              onRowClick={(meal) => handleViewMeal(meal.id)}
              emptyMessage="No meals found"
              emptyDescription="Get started by adding your first meal"
              emptyAction={{
                label: "Add Meal",
                onClick: () => setIsNewMealFormOpen(true)
              }}
            />
          ) : (
            <MealGridView
              meals={filteredMeals}
              onToggleActive={toggleMealActive}
              onViewMeal={handleViewMeal}
              onBuildMeal={handleBuildMeal}
              onEditMeal={handleEditMeal}
            />
          )}

          {/* New Meal Form using GenericModal */}
          <GenericModal
            open={isNewMealFormOpen}
            onOpenChange={setIsNewMealFormOpen}
            title="Add New Meal"
            description="Create a new meal with ingredients and nutritional information."
            size="4xl"
          >
            <MealFormWithIngredients
              onSuccess={() => {
                setIsNewMealFormOpen(false);
                refetch();
              }}
              onCancel={() => setIsNewMealFormOpen(false)}
            />
          </GenericModal>

          {/* Builder using GenericModal */}
          <GenericModal
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
                onNutritionUpdate={() => refetch()}
              />
            )}
          </GenericModal>
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
        onUpdate={refetch}
      />
    </div>
  );
};

export default MealsManager;