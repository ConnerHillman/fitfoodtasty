import { useState, useEffect, useCallback } from "react";
import { subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCustomersData } from "@/hooks/useCustomersData";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { CustomerHeader } from "./CustomerHeader";
import { CustomerStatsDisplay } from "./CustomerStatsDisplay";
import { CustomerFiltersBar } from "./CustomerFiltersBar";
import { CustomerDataDisplay } from "./CustomerDataDisplay";
import { CustomerLoadingState } from "./CustomerLoadingState";
import { CustomerPagination } from "./CustomerPagination";
import CustomerDetailModal from "../CustomerDetailModal";
import { CustomerErrorBoundary } from "@/components/common/CustomerErrorBoundary";

import type { CustomerFilters } from "@/types/customer";

const OptimizedCustomersManager = () => {
  const { toast } = useToast();
  const { 
    customers, 
    loading, 
    error,
    fetchCustomers, 
    getCustomerStats, 
    getCustomerValue,
    invalidateCustomerCache
  } = useCustomersData();
  
  const [filters, setFilters] = useState<CustomerFilters>({
    searchTerm: "",
    sortBy: "created_at",
    sortOrder: "desc",
    filterBy: "all",
    viewMode: "list",
    dateRange: {
      from: new Date(2020, 0, 1), // Show all customers by default
      to: new Date(),
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Optimized search with debouncing
  const searchedCustomers = useOptimizedSearch(
    customers,
    filters.searchTerm,
    ['full_name', 'email', 'phone', 'city', 'postal_code'] as const,
    300
  );

  // Apply additional filters
  const filteredCustomers = searchedCustomers.filter(customer => {
    switch (filters.filterBy) {
      case "with_orders":
        return customer.total_orders > 0;
      case "no_orders":
        return customer.total_orders === 0;
      case "high_value":
        return customer.total_spent > 200;
      case "recent":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return customer.last_order_date && new Date(customer.last_order_date) > thirtyDaysAgo;
      default:
        return true;
    }
  });

  // Sort filtered data
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[filters.sortBy as keyof typeof a];
    const bValue = b[filters.sortBy as keyof typeof b];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return filters.sortOrder === "desc" ? -comparison : comparison;
  });

  // Pagination
  const {
    paginatedResult,
    goToPage,
    setPageSize,
    nextPage,
    previousPage,
  } = usePaginatedData(sortedCustomers, 20);

  const customerStats = getCustomerStats(filteredCustomers);

  useEffect(() => {
    fetchCustomers(filters.dateRange);
  }, [filters.dateRange, fetchCustomers]);

  const handleFiltersChange = useCallback((newFilters: Partial<CustomerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    goToPage(1);
  }, [goToPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate cache and force fresh data
      invalidateCustomerCache();
      await fetchCustomers(filters.dateRange, true);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCustomers, filters.dateRange, invalidateCustomerCache]);

  const handleExport = useCallback(() => {
    toast({
      title: "Coming Soon",
      description: "Customer export feature is being developed",
    });
  }, [toast]);

  // Show error state
  if (error && !loading && customers.length === 0) {
    return (
      <CustomerErrorBoundary onRetry={handleRefresh}>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-muted-foreground">Failed to load customers</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </CustomerErrorBoundary>
    );
  }

  // Show initial loading state
  if (loading && customers.length === 0) {
    return <CustomerLoadingState type="full" />;
  }

  return (
    <CustomerErrorBoundary onRetry={handleRefresh}>
      <div className="space-y-6">
        {/* Header */}
        <CustomerHeader 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing}
        />

        {/* Stats Cards */}
        <CustomerErrorBoundary>
          <CustomerStatsDisplay stats={customerStats} />
        </CustomerErrorBoundary>

        {/* Filters */}
        <CustomerErrorBoundary>
          <CustomerFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalCount={customers.length}
            filteredCount={filteredCustomers.length}
            customers={customers}
            filteredCustomers={filteredCustomers}
            stats={customerStats}
            onExport={handleExport}
          />
        </CustomerErrorBoundary>

        {/* Data Display */}
        <CustomerErrorBoundary>
          {loading && customers.length > 0 ? (
            <CustomerLoadingState type={filters.viewMode === "card" ? "cards" : "table"} />
          ) : (
            <CustomerDataDisplay
              customers={paginatedResult.data}
              filters={filters}
              loading={loading && customers.length === 0}
              getCustomerValue={getCustomerValue}
            />
          )}
        </CustomerErrorBoundary>

        {/* Pagination */}
        {paginatedResult.totalPages > 1 && (
          <CustomerErrorBoundary>
            <CustomerPagination
              paginatedResult={paginatedResult}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
            />
          </CustomerErrorBoundary>
        )}

        {/* Customer Detail Modal */}
        <CustomerDetailModal />
      </div>
    </CustomerErrorBoundary>
  );
};

export default OptimizedCustomersManager;