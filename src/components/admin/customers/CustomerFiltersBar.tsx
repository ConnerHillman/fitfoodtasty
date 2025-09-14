import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Search, Filter, Download, Grid3X3, List } from "lucide-react";
import type { CustomerFilters } from "@/types/customer";

interface CustomerFiltersBarProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: Partial<CustomerFilters>) => void;
  totalCount: number;
  filteredCount: number;
  onExport?: () => void;
}

export function CustomerFiltersBar({ 
  filters, 
  onFiltersChange, 
  totalCount, 
  filteredCount,
  onExport
}: CustomerFiltersBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, phone, or location..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DateRangePicker
            date={filters.dateRange}
            onDateChange={(range) => {
              if (range?.from && range?.to) {
                onFiltersChange({ dateRange: { from: range.from, to: range.to } });
              }
            }}
          />

          <Select
            value={filters.filterBy}
            onValueChange={(value) => onFiltersChange({ filterBy: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="with_orders">With Orders</SelectItem>
              <SelectItem value="no_orders">No Orders</SelectItem>
              <SelectItem value="high_value">High Value</SelectItem>
              <SelectItem value="recent">Recent Active</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFiltersChange({ sortBy: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Joined</SelectItem>
              <SelectItem value="full_name">Name</SelectItem>
              <SelectItem value="total_spent">Total Spent</SelectItem>
              <SelectItem value="total_orders">Total Orders</SelectItem>
              <SelectItem value="last_order_date">Last Order</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortOrder}
            onValueChange={(value: "asc" | "desc") => onFiltersChange({ sortOrder: value })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFiltersChange({ viewMode: 'list' })}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFiltersChange({ viewMode: 'card' })}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} customers
        </span>
      </div>
    </div>
  );
}