import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SimpleDateRangePicker } from "@/components/ui/simple-date-range-picker";
import { Search, Download, Grid3X3, List, Filter, X } from "lucide-react";
import type { BaseFilters, ViewModeFilters, DateRange } from "@/types/common";

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface GenericFiltersBarProps<T extends BaseFilters & ViewModeFilters> {
  filters: T;
  onFiltersChange: (filters: Partial<T>) => void;
  totalCount: number;
  filteredCount: number;
  
  // Search configuration
  searchPlaceholder?: string;
  
  // Custom filters
  customFilters?: FilterOption[];
  customFilterValue?: string;
  onCustomFilterChange?: (value: string) => void;
  customFilterLabel?: string;
  
  // Sort options
  sortOptions?: SortOption[];
  
  // Date range support
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | null) => void;
  clearDateRange?: () => void;
  
  // View mode options
  viewModes?: Array<'list' | 'card' | 'grid'>;
  
  // Export functionality
  onExport?: () => void;
  exportLabel?: string;
  
  // Entity name for display
  entityName: string;
  entityNamePlural: string;
}

export function GenericFiltersBar<T extends BaseFilters & ViewModeFilters>({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  searchPlaceholder = "Search...",
  customFilters,
  customFilterValue,
  onCustomFilterChange,
  customFilterLabel = "Filter",
  sortOptions,
  dateRange,
  onDateRangeChange,
  clearDateRange,
  viewModes = ['list', 'card'],
  onExport,
  exportLabel = "Export",
  entityName,
  entityNamePlural
}: GenericFiltersBarProps<T>) {
  
  const defaultSortOptions: SortOption[] = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Updated' },
  ];

  const activeSortOptions = sortOptions || defaultSortOptions;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value } as Partial<T>)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Date Range Picker */}
          {onDateRangeChange && (
            <div className="flex items-center gap-2">
              <SimpleDateRangePicker
                date={dateRange}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ from: range.from, to: range.to });
                  } else {
                    onDateRangeChange(null);
                  }
                }}
                placeholder="Select date range"
                className="w-full sm:w-auto"
                showClearButton={true}
              />
              {clearDateRange && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateRange}
                  className="px-2 hidden sm:flex"
                  title="Clear date selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Custom Filter */}
          {customFilters && customFilters.length > 0 && (
            <Select
              value={customFilterValue}
              onValueChange={onCustomFilterChange}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={customFilterLabel} />
              </SelectTrigger>
              <SelectContent>
                {customFilters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort By */}
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFiltersChange({ sortBy: value } as Partial<T>)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {activeSortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select
            value={filters.sortOrder}
            onValueChange={(value: "asc" | "desc") => onFiltersChange({ sortOrder: value } as Partial<T>)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          {viewModes.length > 1 && (
            <div className="flex border rounded-md">
              {viewModes.includes('list') && (
                <Button
                  variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFiltersChange({ viewMode: 'list' } as Partial<T>)}
                  className={viewModes.length > 1 ? "rounded-r-none" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
              )}
              {viewModes.includes('card') && (
                <Button
                  variant={filters.viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFiltersChange({ viewMode: 'card' } as Partial<T>)}
                  className={
                    viewModes.indexOf('card') === 0 ? "rounded-r-none" :
                    viewModes.indexOf('card') === viewModes.length - 1 ? "rounded-l-none" :
                    "rounded-none"
                  }
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              )}
              {viewModes.includes('grid') && (
                <Button
                  variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFiltersChange({ viewMode: 'grid' } as Partial<T>)}
                  className={viewModes.length > 1 ? "rounded-l-none" : ""}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Export Button */}
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {exportLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} {filteredCount === 1 ? entityName : entityNamePlural}
        </span>
      </div>
    </div>
  );
}