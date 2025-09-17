import { useState, useMemo, useEffect } from "react";
import { Plus, Package, Settings, BarChart3, Image, ChevronUp, ChevronDown, Edit, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// Import new admin components
import { 
  AdminLayout, 
  AdminTable, 
  AdminStatsGrid, 
  AdminFormModal, 
  AdminTabsLayout 
} from "../common";
import type { ColumnDef, ActionItem, StatCard, TabConfig } from "../common";

// Import specific components
import PackageAnalytics from "../PackageAnalytics";
import PackageForm from "./PackageForm";
import PackageMealsManager from "./PackageMealsManager";

// Import hooks
import { useAdminCrud } from "@/hooks/useAdminCrud";

interface Package {
  id: string;
  name: string;
  description?: string;
  meal_count: number;
  price: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const RefactoredPackagesManager = () => {
  const { toast } = useToast();
  
  // Using the new admin CRUD hook
  const {
    data: packages,
    loading,
    create,
    update,
    remove,
    toggle,
    fetchData,
    bulkUpdate
  } = useAdminCrud<Package>({
    table: 'packages',
    entityName: 'package',
    defaultOrderBy: { column: 'sort_order', ascending: true },
    onSuccess: {
      create: 'Package created successfully',
      update: 'Package updated successfully',
      delete: 'Package deleted successfully'
    }
  });

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMealsManagerOpen, setIsMealsManagerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedPackageForMeals, setSelectedPackageForMeals] = useState<Package | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats calculation
  const stats: StatCard[] = useMemo(() => {
    const activePackages = packages.filter(p => p.is_active);
    const totalRevenue = packages.reduce((sum, p) => sum + p.price, 0);
    const avgPrice = packages.length > 0 ? totalRevenue / packages.length : 0;
    const avgMealCount = packages.length > 0 
      ? packages.reduce((sum, p) => sum + p.meal_count, 0) / packages.length 
      : 0;

    return [
      {
        id: 'total',
        title: 'Total Packages',
        value: packages.length,
        icon: Package,
        iconColor: 'text-blue-500'
      },
      {
        id: 'active',
        title: 'Active Packages',
        value: activePackages.length,
        subtitle: `${packages.length - activePackages.length} inactive`,
        icon: Power,
        iconColor: 'text-green-500'
      },
      {
        id: 'avg_price',
        title: 'Average Price',
        value: formatCurrency(avgPrice),
        icon: BarChart3,
        iconColor: 'text-emerald-500'
      },
      {
        id: 'avg_meals',
        title: 'Average Meal Count',
        value: Math.round(avgMealCount),
        subtitle: 'meals per package',
        icon: Settings,
        iconColor: 'text-orange-500'
      }
    ];
  }, [packages]);

  // Table columns
  const columns: ColumnDef<Package>[] = [
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      accessor: (pkg) => {
        const index = packages.findIndex(p => p.id === pkg.id);
        return (
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                movePackage(pkg.id, 'up');
              }}
              disabled={index === 0}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                movePackage(pkg.id, 'down');
              }}
              disabled={index === packages.length - 1}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    },
    {
      key: 'image_url',
      header: 'Image',
      width: '60px',
      accessor: (pkg) => (
        pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="w-12 h-12 object-cover rounded-md"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
            <Image className="h-4 w-4 text-muted-foreground" />
          </div>
        )
      )
    },
    {
      key: 'name',
      header: 'Package Name',
      accessor: (pkg) => (
        <div>
          <div className="font-medium">{pkg.name}</div>
          {pkg.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {pkg.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'meal_count',
      header: 'Meals',
      cell: (value: number) => (
        <Badge variant="secondary">{value} meals</Badge>
      )
    },
    {
      key: 'price',
      header: 'Price',
      cell: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'is_active',
      header: 'Status',
      accessor: (pkg) => (
        <Badge variant={pkg.is_active ? "default" : "secondary"}>
          {pkg.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    }
  ];

  // Event handlers
  const handleCreateNew = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"?`)) return;
    await remove(pkg.id);
  };

  const handleManageMeals = (pkg: Package) => {
    setSelectedPackageForMeals(pkg);
    setIsMealsManagerOpen(true);
  };

  // Table actions
  const actions: ActionItem<Package>[] = [
    {
      label: 'Manage Meals',
      icon: Settings,
      onClick: handleManageMeals,
      variant: 'outline'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
      variant: 'outline'
    },
    {
      label: 'Toggle Status',
      icon: Power,
      onClick: (pkg) => toggle(pkg.id, 'is_active'),
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive'
    }
  ];


  const movePackage = async (packageId: string, direction: 'up' | 'down') => {
    const currentIndex = packages.findIndex(p => p.id === packageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= packages.length) return;

    const currentPackage = packages[currentIndex];
    const targetPackage = packages[newIndex];

    // Perform bulk update for sort order swap
    await bulkUpdate([
      { id: currentPackage.id, data: { sort_order: targetPackage.sort_order } },
      { id: targetPackage.id, data: { sort_order: currentPackage.sort_order } }
    ]);
  };

  const handleFormSuccess = async (packageData: any) => {
    if (editingPackage) {
      await update(editingPackage.id, packageData);
    } else {
      await create(packageData);
    }
    setIsFormOpen(false);
  };

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      value: 'management',
      label: 'Package Management',
      icon: Settings,
      content: (
        <div className="space-y-6">
          {/* Stats Grid */}
          <AdminStatsGrid 
            stats={stats} 
            loading={loading} 
            columns={4} 
          />

          {/* Packages Table */}
          <AdminTable
            title="Packages"
            data={packages}
            columns={columns}
            actions={actions}
            loading={loading}
            searchable={true}
            searchPlaceholder="Search packages by name or description..."
            onRefresh={fetchData}
            onExport={() => toast({ title: "Export", description: "Export functionality coming soon" })}
            emptyMessage="No packages found"
            emptyDescription="Get started by creating your first package"
          />
        </div>
      )
    },
    {
      value: 'analytics',
      label: 'Analytics & Insights',
      icon: BarChart3,
      content: <PackageAnalytics />
    }
  ];

  return (
    <AdminLayout
      title="Package Management"
      description="Create and manage meal packages with pricing and analytics"
      icon={Package}
      primaryAction={{
        label: "Add Package",
        onClick: handleCreateNew,
        icon: Plus
      }}
    >
      <AdminTabsLayout tabs={tabs} defaultValue="management" />

      {/* Package Form Modal */}
      <AdminFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingPackage ? "Edit Package" : "Create New Package"}
        description={editingPackage ? "Update package details" : "Add a new meal package"}
        size="lg"
      >
        <PackageForm
          package={editingPackage}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </AdminFormModal>

      {/* Package Meals Manager Modal */}
      <AdminFormModal
        open={isMealsManagerOpen}
        onOpenChange={setIsMealsManagerOpen}
        title="Manage Package Meals"
        description={`Configure available meals for ${selectedPackageForMeals?.name}`}
        size="2xl"
      >
        {selectedPackageForMeals && (
          <PackageMealsManager
            package={selectedPackageForMeals}
            onSuccess={() => setIsMealsManagerOpen(false)}
            onCancel={() => setIsMealsManagerOpen(false)}
          />
        )}
      </AdminFormModal>
    </AdminLayout>
  );
};

export default RefactoredPackagesManager;