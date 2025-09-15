import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Plus, Tag, Sliders, FilterIcon, SortAsc, ToggleLeft, ToggleRight } from "lucide-react";
import { useFiltersData } from "@/hooks/useFiltersData";
import FilterFormModal from "./FilterFormModal";
import DeleteDialog from "./DeleteDialog";
import type { Filter, FilterFilters } from "@/types/filter";

const FiltersManager = () => {
  const { toast } = useToast();
  const { filters, loading, deleteFilter, toggleFilterActive } = useFiltersData();
  
  // Filter state
  const [filtersState, setFiltersState] = useState<FilterFilters>({
    searchQuery: "",
    typeFilter: 'all',
    categoryFilter: 'all',
    statusFilter: 'all',
    sortBy: 'category',
    sortOrder: 'asc'
  });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...filters];

    // Apply search filter
    if (filtersState.searchQuery) {
      result = result.filter(filter =>
        filter.name.toLowerCase().includes(filtersState.searchQuery.toLowerCase()) ||
        filter.type.toLowerCase().includes(filtersState.searchQuery.toLowerCase()) ||
        (filter.category && filter.category.toLowerCase().includes(filtersState.searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (filtersState.categoryFilter !== 'all') {
      result = result.filter(filter => {
        if (filtersState.categoryFilter === 'uncategorized') {
          return !filter.category;
        }
        return filter.category === filtersState.categoryFilter;
      });
    }

    // Apply type filter
    if (filtersState.typeFilter !== 'all') {
      result = result.filter(filter => filter.type === filtersState.typeFilter);
    }

    // Apply status filter
    if (filtersState.statusFilter !== 'all') {
      const isActive = filtersState.statusFilter === 'active';
      result = result.filter(filter => filter.is_active === isActive);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[filtersState.sortBy as keyof Filter];
      let bValue: any = b[filtersState.sortBy as keyof Filter];

      if (filtersState.sortBy === 'category') {
        aValue = aValue || 'Uncategorized';
        bValue = bValue || 'Uncategorized';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return filtersState.sortOrder === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return filtersState.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filtersState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filters, filtersState]);

  const handleEditFilter = (filter: Filter) => {
    setSelectedFilter(filter);
    setIsFormModalOpen(true);
  };

  const handleDeleteFilter = (filter: Filter) => {
    setSelectedFilter(filter);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = async (filter: Filter) => {
    try {
      await toggleFilterActive(filter);
      toast({
        title: "Success",
        description: `Filter ${filter.is_active ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update filter status",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (selectedFilter) {
      setIsDeleting(true);
      try {
        await deleteFilter(selectedFilter.id);
        setIsDeleteDialogOpen(false);
        setSelectedFilter(null);
      } catch (error) {
        console.error('Error deleting filter:', error);
      } finally {
        setIsDeleting(false);
      }
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
      case 'dietary': return 'bg-green-100 text-green-800';
      case 'nutrition': return 'bg-blue-100 text-blue-800';
      case 'calorie': return 'bg-orange-100 text-orange-800';
      case 'sorting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Filters Manager</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading filters...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Filters Manager</h2>
        <Button 
          onClick={() => setIsFormModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Filters</CardTitle>
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
            <ToggleRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filters.filter(f => f.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filters.map(f => f.category || 'Uncategorized')).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types</CardTitle>
            <Sliders className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(filters.map(f => f.type)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search filters..."
                value={filtersState.searchQuery}
                onChange={(e) => setFiltersState(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </div>
            <Select 
              value={filtersState.categoryFilter} 
              onValueChange={(value) => setFiltersState(prev => ({ ...prev, categoryFilter: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Dietary">Dietary</SelectItem>
                <SelectItem value="Nutrition">Nutrition</SelectItem>
                <SelectItem value="Preferences">Preferences</SelectItem>
                <SelectItem value="Display">Display</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filtersState.typeFilter} 
              onValueChange={(value) => setFiltersState(prev => ({ ...prev, typeFilter: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dietary">Dietary</SelectItem>
                <SelectItem value="nutrition">Nutrition</SelectItem>
                <SelectItem value="calorie">Calorie</SelectItem>
                <SelectItem value="sorting">Sorting</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filtersState.statusFilter} 
              onValueChange={(value) => setFiltersState(prev => ({ ...prev, statusFilter: value as 'all' | 'active' | 'inactive' }))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filters Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Configuration</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((filter) => (
                  <tr key={filter.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{filter.name}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="capitalize">
                        {filter.category || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(filter.type)}
                        <Badge variant="secondary" className={`capitalize ${getTypeColor(filter.type)}`}>
                          {filter.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground max-w-[200px] truncate">
                      {formatThreshold(filter.threshold)}
                    </td>
                    <td className="p-2">
                      <Badge variant={filter.is_active ? "default" : "secondary"}>
                        {filter.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFilter(filter)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(filter)}
                        >
                          {filter.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFilter(filter)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No filters found. Create your first filter to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <FilterFormModal
        open={isFormModalOpen}
        onOpenChange={(open) => {
          setIsFormModalOpen(open);
          if (!open) setSelectedFilter(null);
        }}
        filter={selectedFilter}
      />

      <DeleteDialog
        isVisible={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        selectedCoupon={selectedFilter}
        isSubmitting={isDeleting}
      />
    </div>
  );
};

export default FiltersManager;