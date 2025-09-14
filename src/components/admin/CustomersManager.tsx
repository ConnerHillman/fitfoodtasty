import { useState, useEffect } from "react";
import { RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCustomersData } from "@/hooks/useCustomersData";
import { useFilteredCustomers } from "@/hooks/useFilteredCustomers";
import { CustomerStatsCards } from "./customers/CustomerStatsCards";
import { CustomerFiltersBar } from "./customers/CustomerFiltersBar";
import { CustomerCardView } from "./customers/CustomerCardView";
import AddCustomerDialog from "./AddCustomerDialog";
import type { CustomerFilters } from "@/types/customer";

const CustomersManager = () => {
  const { toast } = useToast();
  const { customers, loading, fetchCustomers, getCustomerStats, getCustomerValue } = useCustomersData();
  
  const [filters, setFilters] = useState<CustomerFilters>({
    searchTerm: "",
    sortBy: "created_at",
    sortOrder: "desc",
    filterBy: "all",
    viewMode: "list",
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    }
  });

  const filteredCustomers = useFilteredCustomers(customers, filters);
  const customerStats = getCustomerStats(filteredCustomers);

  useEffect(() => {
    fetchCustomers(filters.dateRange);
  }, [filters.dateRange]);

  const handleFiltersChange = (newFilters: Partial<CustomerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    fetchCustomers(filters.dateRange);
  };

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Customer export feature is being developed",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Customer Management</h2>
            <p className="text-muted-foreground">View and manage your customer base</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AddCustomerDialog onCustomerAdded={handleRefresh} />
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <CustomerStatsCards stats={customerStats} />

      {/* Filters and Controls */}
      <CustomerFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={customers.length}
        filteredCount={filteredCustomers.length}
        onExport={handleExport}
      />

      {/* Customer Display */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No customers found matching your filters.</p>
        </div>
      ) : (
        <CustomerCardView
          customers={filteredCustomers}
          getCustomerValue={getCustomerValue}
        />
      )}
    </div>
  );
};

export default CustomersManager;