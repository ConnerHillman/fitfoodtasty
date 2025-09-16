import { useState } from "react";
import { Search, Filter, Users, SlidersHorizontal, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CustomerExportButton } from "./CustomerExportButton";
import type { CustomerFilters, Customer, CustomerStats } from "@/types/customer";

interface CustomerFiltersBarProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: Partial<CustomerFilters>) => void;
  totalCount: number;
  filteredCount: number;
  customers?: Customer[];
  filteredCustomers?: Customer[];
  stats?: CustomerStats;
  onExport?: () => void;
}

export function CustomerFiltersBar({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  customers = [],
  filteredCustomers = [],
  stats = { total: 0, withOrders: 0, totalRevenue: 0, averageOrderValue: 0, activeCustomers: 0 },
  onExport,
}: CustomerFiltersBarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Mobile-first layout */}
        <div className="space-y-4">
          {/* Search and primary controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={filters.searchTerm}
                onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            {/* Mobile: Collapsible filters */}
            <div className="flex gap-2 sm:hidden">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {(filters.filterBy !== "all" || filters.sortBy !== "created_at") && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              
              <CustomerExportButton
                customers={customers}
                filteredCustomers={filteredCustomers}
                stats={stats}
              />
            </div>

            {/* Desktop: Inline filters */}
            <div className="hidden sm:flex items-center gap-3">
              <Select
                value={filters.filterBy}
                onValueChange={(value) => onFiltersChange({ filterBy: value })}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="with_orders">With Orders</SelectItem>
                  <SelectItem value="no_orders">No Orders</SelectItem>
                  <SelectItem value="high_value">High Value</SelectItem>
                  <SelectItem value="recent">Recent Activity</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) => onFiltersChange({ sortBy: value })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Join Date</SelectItem>
                  <SelectItem value="full_name">Name</SelectItem>
                  <SelectItem value="total_spent">Total Spent</SelectItem>
                  <SelectItem value="total_orders">Order Count</SelectItem>
                  <SelectItem value="last_order_date">Last Order</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortOrder}
                onValueChange={(value: "asc" | "desc") => onFiltersChange({ sortOrder: value })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓ Desc</SelectItem>
                  <SelectItem value="asc">↑ Asc</SelectItem>
                </SelectContent>
              </Select>

              <CustomerExportButton
                customers={customers}
                filteredCustomers={filteredCustomers}
                stats={stats}
              />
            </div>
          </div>

          {/* Mobile: Collapsible filter content */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleContent className="sm:hidden">
              <div className="grid grid-cols-1 gap-3 pt-3 border-t">
                <Select
                  value={filters.filterBy}
                  onValueChange={(value) => onFiltersChange({ filterBy: value })}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter customers..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="with_orders">With Orders</SelectItem>
                    <SelectItem value="no_orders">No Orders</SelectItem>
                    <SelectItem value="high_value">High Value</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => onFiltersChange({ sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Join Date</SelectItem>
                      <SelectItem value="full_name">Name</SelectItem>
                      <SelectItem value="total_spent">Total Spent</SelectItem>
                      <SelectItem value="total_orders">Order Count</SelectItem>
                      <SelectItem value="last_order_date">Last Order</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: "asc" | "desc") => onFiltersChange({ sortOrder: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">↓ Descending</SelectItem>
                      <SelectItem value="asc">↑ Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DateRangePicker
                  date={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                  onDateChange={(range) => 
                    onFiltersChange({ 
                      dateRange: { 
                        from: range?.from || new Date(), 
                        to: range?.to || new Date() 
                      } 
                    })
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* View mode toggle and date range (desktop) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={filters.viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onFiltersChange({ viewMode: "list" })}
                  className="h-7 px-2"
                >
                  <List className="h-3 w-3" />
                  <span className="ml-1 hidden sm:inline">List</span>
                </Button>
                <Button
                  variant={filters.viewMode === "card" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onFiltersChange({ viewMode: "card" })}
                  className="h-7 px-2"
                >
                  <Grid className="h-3 w-3" />
                  <span className="ml-1 hidden sm:inline">Cards</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {filteredCount === totalCount 
                    ? `${totalCount} customers` 
                    : `${filteredCount} of ${totalCount} customers`}
                </span>
              </div>
            </div>

            <div className="hidden sm:block">
              <DateRangePicker
                date={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                onDateChange={(range) => 
                  onFiltersChange({ 
                    dateRange: { 
                      from: range?.from || new Date(), 
                      to: range?.to || new Date() 
                    } 
                  })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}