import { useState, useMemo, useEffect } from "react";
import { Plus, Package, Settings, BarChart3, Image, ChevronUp, ChevronDown, Edit, Trash2, Power, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMealsManagerOpen, setIsMealsManagerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedPackageForMeals, setSelectedPackageForMeals] = useState<Package | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered packages based on search and filters
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(term) ||
        pkg.description?.toLowerCase().includes(term) ||
        pkg.meal_count.toString().includes(term) ||
        formatCurrency(pkg.price).toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => 
        statusFilter === 'active' ? pkg.is_active : !pkg.is_active
      );
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(pkg => {
        if (priceFilter === 'low') return pkg.price < 15;
        if (priceFilter === 'medium') return pkg.price >= 15 && pkg.price < 25;
        if (priceFilter === 'high') return pkg.price >= 25;
        return true;
      });
    }

    return filtered;
  }, [packages, searchTerm, statusFilter, priceFilter]);

  // Stats calculation
  const stats: StatCard[] = useMemo(() => {
    const activePackages = filteredPackages.filter(p => p.is_active);
    const totalRevenue = filteredPackages.reduce((sum, p) => sum + p.price, 0);
    const avgPrice = filteredPackages.length > 0 ? totalRevenue / filteredPackages.length : 0;
    const avgMealCount = filteredPackages.length > 0 
      ? filteredPackages.reduce((sum, p) => sum + p.meal_count, 0) / filteredPackages.length 
      : 0;

    return [
      {
        id: 'total',
        title: 'Total Packages',
        value: filteredPackages.length,
        subtitle: packages.length !== filteredPackages.length ? `${packages.length} total` : undefined,
        icon: Package,
        iconColor: 'text-blue-500'
      },
      {
        id: 'active',
        title: 'Active Packages',
        value: activePackages.length,
        subtitle: `${filteredPackages.length - activePackages.length} inactive`,
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
  }, [filteredPackages]);

  // Table columns
  const columns: ColumnDef<Package>[] = [
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      accessor: (pkg) => {
        const index = filteredPackages.findIndex(p => p.id === pkg.id);
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
              disabled={index === filteredPackages.length - 1}
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
    const currentIndex = filteredPackages.findIndex(p => p.id === packageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= filteredPackages.length) return;

    const currentPackage = filteredPackages[currentIndex];
    const targetPackage = filteredPackages[newIndex];

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
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages by name, description, price..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priceFilter} onValueChange={(value: 'all' | 'low' | 'medium' | 'high') => setPriceFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="low">Under £15</SelectItem>
                  <SelectItem value="medium">£15 - £25</SelectItem>
                  <SelectItem value="high">Over £25</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter('all');
                  setPriceFilter('all');
                }}
                title="Clear filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <AdminStatsGrid 
            stats={stats} 
            loading={loading} 
            columns={4} 
          />

          {/* Packages Table */}
          <AdminTable
            title={`Packages ${searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? '(Filtered)' : ''}`}
            data={filteredPackages}
            columns={columns}
            actions={actions}
            loading={loading}
            searchable={false} // We're handling search ourselves now
            onRefresh={fetchData}
            onExport={() => toast({ title: "Export", description: "Export functionality coming soon" })}
            emptyMessage={searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? "No packages match your filters" : "No packages found"}
            emptyDescription={searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? "Try adjusting your search criteria" : "Get started by creating your first package"}
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