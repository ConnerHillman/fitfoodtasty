import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Grid, List } from "lucide-react";
import type { Category, MealFilters } from "@/types/meal";

interface MealFiltersBarProps {
  filters: MealFilters;
  categories: Category[];
  onFiltersChange: (filters: Partial<MealFilters>) => void;
  totalCount: number;
  filteredCount: number;
}

export function MealFiltersBar({ 
  filters, 
  categories, 
  onFiltersChange, 
  totalCount, 
  filteredCount 
}: MealFiltersBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meals by name, description, or category..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={filters.statusFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive') => 
              onFiltersChange({ statusFilter: value })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.categoryFilter}
            onValueChange={(value) => onFiltersChange({ categoryFilter: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="inline-flex rounded-lg bg-muted p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({ viewMode: 'list' })}
              className={`px-3 h-8 rounded-md transition-all ${
                filters.viewMode === 'list' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({ viewMode: 'grid' })}
              className={`px-3 h-8 rounded-md transition-all ${
                filters.viewMode === 'grid' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
              }`}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} meals
        </span>
      </div>
    </div>
  );
}