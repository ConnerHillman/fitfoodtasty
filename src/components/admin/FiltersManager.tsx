import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Power, Trash2, Filter as FilterIcon, Sliders, Tag, SortAsc } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFiltersData } from "@/hooks/useFiltersData";
import { useFilteredData } from "@/hooks/useFilteredData";

// Import generic components
import { GenericFiltersBar, StatsCardsGrid, GenericDataTable, GenericModal } from "@/components/common";
import FilterFormModal from "./FilterFormModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import type { Filter, FilterFilters } from "@/types/filter";
import type { StatCardData, ColumnDef, ActionItem } from "@/components/common";

const FiltersManager = () => {
  const { toast } = useToast();
  const { filters, loading, deleteFilter, toggleFilterActive } = useFiltersData();
  
  // Filter state
  const [filtersState, setFiltersState] = useState<FilterFilters>({
    searchQuery: "",
    typeFilter: 'all',
    statusFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);

  const filteredFilters = useFilteredData(filters, {
    searchTerm: filtersState.searchQuery,
    searchFields: ['name', 'type'] as (keyof Filter)[],
    statusField: 'is_active' as keyof Filter,
    statusFilter: filtersState.statusFilter,
    sortBy: filtersState.sortBy,
    sortOrder: filtersState.sortOrder,
    customFilter: (filter: Filter) => {
      if (filtersState.typeFilter !== 'all') {
        return filter.type === filtersState.typeFilter;
      }
      return true;
    }
  });

  // Convert filters to match GenericFiltersBar interface
  const genericFilters = useMemo(() => ({
    searchTerm: filtersState.searchQuery,
    sortBy: filtersState.sortBy,
    sortOrder: filtersState.sortOrder,
    viewMode: 'list' as const,
  }), [filtersState]);

  const handleFiltersChange = (newFilters: any) => {
    const updatedFilters: Partial<FilterFilters> = {};
    
    if ('searchTerm' in newFilters) {
      updatedFilters.searchQuery = newFilters.searchTerm;
    }
    if ('sortBy' in newFilters) {
      updatedFilters.sortBy = newFilters.sortBy;
    }
    if ('sortOrder' in newFilters) {
      updatedFilters.sortOrder = newFilters.sortOrder;
    }
    
    setFiltersState(prev => ({ ...prev, ...updatedFilters }));
  };

  const handleEditFilter = (filter: Filter) => {
    setSelectedFilter(filter);
    setIsFormModalOpen(true);
  };

  const handleDeleteFilter = (filter: Filter) => {
    setSelectedFilter(filter);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedFilter) {
      await deleteFilter(selectedFilter.id);
      setIsDeleteDialogOpen(false);
      setSelectedFilter(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dietary': return <Tag className="h-4 w-4" />;
      case 'nutrition': return <Sliders className="h-4 w-4" />;
      case 'calorie': return <FilterIcon className="h-4 w-4" />;
      case 'sorting': return <SortAsc className="h-4 w-4" />;
      default: return <FilterIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dietary': return 'bg-green-100 text-green-800 border-green-200';
      case 'nutrition': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'calorie': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sorting': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatThreshold = (threshold: any) => {
    if (!threshold) return 'None';
    
    const entries = Object.entries(threshold);
    if (entries.length === 0) return 'None';
    
    return entries.map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
      return `${label}: ${value}`;
    }).join(', ');
  };

  // Stats data
  const statsData: StatCardData[] = useMemo(() => {
    const activeFilters = filters.filter(f => f.is_active);
    const inactiveFilters = filters.filter(f => !f.is_active);
    const typeGroups = filters.reduce((acc, filter) => {
      acc[filter.type] = (acc[filter.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        id: 'total',
        title: 'Total Filters',
        value: filters.length,
        icon: FilterIcon,
        iconColor: 'text-blue-500'
      },
      {
        id: 'active',
        title: 'Active Filters',
        value: activeFilters.length,
        icon: Power,
        iconColor: 'text-green-500',
        subtitle: `${inactiveFilters.length} inactive`
      },
      {
        id: 'dietary',
        title: 'Dietary Filters',
        value: typeGroups.dietary || 0,
        icon: Tag,
        iconColor: 'text-green-500'
      },
      {
        id: 'nutrition',
        title: 'Nutrition Filters',
        value: typeGroups.nutrition || 0,
        icon: Sliders,
        iconColor: 'text-blue-500'
      }
    ];
  }, [filters]);

  // Table columns
  const columns: ColumnDef<Filter>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (filter) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(filter.type)}
          <span className="font-medium">{filter.name}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (filter) => (
        <Badge className={`border ${getTypeColor(filter.type)}`}>
          {filter.type}
        </Badge>
      )
    },
    {
      key: 'threshold',
      header: 'Threshold',
      accessor: (filter) => (
        <span className="text-sm text-muted-foreground">
          {formatThreshold(filter.threshold)}
        </span>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      accessor: (filter) => (
        <Badge variant={filter.is_active ? "default" : "secondary"}>
          {filter.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    }
  ];

  // Table actions
  const actions: ActionItem<Filter>[] = [
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEditFilter,
      variant: 'outline'
    },
    {
      label: 'Toggle Status',
      icon: Power,
      onClick: toggleFilterActive,
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDeleteFilter,
      variant: 'outline'
    }
  ];

  // Filter options
  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'dietary', label: 'Dietary' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'calorie', label: 'Calorie' },
    { value: 'sorting', label: 'Sorting' }
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'created_at', label: 'Date Created' }
  ];

  if (loading) {
    return <div>Loading filters...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Filters Management</h3>
          <p className="text-muted-foreground">
            Manage dynamic filters for the menu page
          </p>
        </div>
        <Button onClick={() => { setSelectedFilter(null); setIsFormModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCardsGrid 
        stats={statsData}
        columns={4}
        loading={loading}
      />

      {/* Filters Bar */}
      <GenericFiltersBar
        filters={genericFilters}
        onFiltersChange={handleFiltersChange}
        totalCount={filters.length}
        filteredCount={filteredFilters.length}
        searchPlaceholder="Search filters by name or type..."
        customFilters={[
          ...statusFilterOptions,
          ...typeFilterOptions
        ]}
        customFilterValue={filtersState.statusFilter}
        onCustomFilterChange={(value) => {
          if (['all', 'active', 'inactive'].includes(value)) {
            setFiltersState(prev => ({ ...prev, statusFilter: value as any }));
          } else {
            setFiltersState(prev => ({ ...prev, typeFilter: value }));
          }
        }}
        sortOptions={sortOptions}
        onExport={() => toast({ title: "Export", description: "Export functionality coming soon" })}
        entityName="filter"
        entityNamePlural="filters"
      />

      {/* Data Table */}
      <GenericDataTable
        data={filteredFilters}
        columns={columns}
        actions={actions}
        loading={loading}
        getRowId={(filter) => filter.id}
        onRowClick={handleEditFilter}
        emptyMessage="No filters found"
        emptyDescription="Get started by adding your first filter"
        emptyAction={{
          label: "Add Filter",
          onClick: () => { setSelectedFilter(null); setIsFormModalOpen(true); }
        }}
      />

      {/* Form Modal */}
      <FilterFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        filter={selectedFilter}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Filter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFilter?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FiltersManager;