import { useState, useMemo, useEffect } from "react";
import { Plus, Package, Settings, BarChart3, Image, Edit, Trash2, Power, Search, Filter, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// Drag and drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

// Import new admin components
import { 
  AdminLayout, 
  AdminStatsGrid, 
  AdminFormModal, 
  AdminTabsLayout 
} from "../common";
import type { StatCard, TabConfig } from "../common";

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

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sortable Package Item Component
  const SortablePackageItem = ({ pkg }: { pkg: Package }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: pkg.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative bg-card border rounded-lg p-4 hover:shadow-md transition-all ${
          isDragging ? 'z-50 shadow-lg' : ''
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 cursor-grab hover:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-start gap-4 ml-6">
          {/* Package Image */}
          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {pkg.image_url ? (
              <img
                src={pkg.image_url}
                alt={pkg.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Package Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {pkg.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary">
                    {pkg.meal_count} meals
                  </Badge>
                  <span className="font-semibold text-lg">
                    {formatCurrency(pkg.price)}
                  </span>
                  <Badge variant={pkg.is_active ? "default" : "secondary"}>
                    {pkg.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageMeals(pkg)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Meals
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(pkg)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggle(pkg.id, 'is_active')}
                >
                  <Power className="h-4 w-4 mr-1" />
                  Toggle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pkg)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredPackages.findIndex(pkg => pkg.id === active.id);
      const newIndex = filteredPackages.findIndex(pkg => pkg.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPackages = arrayMove(filteredPackages, oldIndex, newIndex);
        
        // Update sort_order values based on new positions
        const updatePromises = reorderedPackages.map((pkg, index) => 
          update(pkg.id, { sort_order: index })
        );
        
        try {
          await Promise.all(updatePromises);
          toast({
            title: "Success",
            description: "Package order updated successfully"
          });
          // Refresh data to get updated sort orders
          fetchData();
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update package order",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handleFormSuccess = async (packageData: any) => {
    if (editingPackage) {
      await update(editingPackage.id, packageData);
    } else {
      // Set sort_order to be the last position
      const maxSortOrder = Math.max(...packages.map(p => p.sort_order || 0), -1);
      await create({ ...packageData, sort_order: maxSortOrder + 1 });
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

          {/* Packages - Drag and Drop Grid */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Packages {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' ? '(Filtered)' : ''}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag packages to reorder them
                </p>
              </div>
              
              <SortableContext items={filteredPackages.map(pkg => pkg.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {filteredPackages.map((pkg) => (
                    <SortablePackageItem key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </SortableContext>
              
              {filteredPackages.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' 
                      ? "No packages match your filters" 
                      : "No packages found"
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || priceFilter !== 'all' 
                      ? "Try adjusting your search criteria" 
                      : "Get started by creating your first package"
                    }
                  </p>
                  {(!searchTerm && statusFilter === 'all' && priceFilter === 'all') && (
                    <Button onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Package
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DndContext>
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