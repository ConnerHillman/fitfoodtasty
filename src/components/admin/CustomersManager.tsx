import { useState, useEffect } from "react";
import { RefreshCw, Users, UserPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCustomersData } from "@/hooks/useCustomersData";
import { useFilteredCustomers } from "@/hooks/useFilteredCustomers";
import { GenericDataTable } from "@/components/common/GenericDataTable";
import { GenericFiltersBar } from "@/components/common/GenericFiltersBar";
import { StatsCardsGrid } from "@/components/common/StatsCards";
import { GenericModal } from "@/components/common/GenericModal";
import AddCustomerDialog from "./AddCustomerDialog";
import CustomerDetailModal from "./CustomerDetailModal";
import type { CustomerFilters } from "@/types/customer";

const CustomersManager = () => {
  const { toast } = useToast();
  const { customers, loading, fetchCustomers, getCustomerStats, getCustomerValue } = useCustomersData();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
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

  const statsData = [
    {
      id: "total-customers",
      title: "Total Customers",
      value: customerStats.total.toString(),
      subtitle: "Active customer accounts",
      icon: Users,
    },
    {
      id: "active-customers",
      title: "Active Customers", 
      value: customerStats.activeCustomers.toString(),
      subtitle: "Customers with recent activity",
      icon: UserPlus,
    },
    {
      id: "customers-with-orders",
      title: "With Orders",
      value: customerStats.withOrders.toString(),
      subtitle: "Customers with pending orders",
      icon: RefreshCw,
    },
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: `£${customerStats.totalRevenue.toFixed(2)}`,
      subtitle: "Combined customer revenue",
      icon: Download,
    },
  ];

  const tableColumns = [
    {
      key: "display_name",
      label: "Name",
      sortable: true,
      render: (customer: any) => (
        <div>
          <div className="font-medium">{customer.display_name}</div>
          <div className="text-sm text-muted-foreground">{customer.user_email}</div>
        </div>
      ),
    },
    {
      key: "total_orders",
      label: "Orders",
      sortable: true,
      render: (customer: any) => customer.total_orders || 0,
    },
    {
      key: "total_spent",
      label: "Total Spent",
      sortable: true,
      render: (customer: any) => `£${(customer.total_spent || 0).toFixed(2)}`,
    },
    {
      key: "created_at",
      label: "Joined",
      sortable: true,
      render: (customer: any) => new Date(customer.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (customer: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCustomer(customer)}
        >
          View Details
        </Button>
      ),
    },
  ];

  const filterOptions = [
    { value: "all", label: "All Customers" },
    { value: "active", label: "Active" },
    { value: "new", label: "New This Month" },
  ];

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
      <StatsCardsGrid stats={statsData} />

      {/* Filters and Table */}
      <GenericFiltersBar
        searchValue={filters.searchTerm}
        onSearchChange={(value) => handleFiltersChange({ searchTerm: value })}
        filterValue={filters.filterBy}
        onFilterChange={(value) => handleFiltersChange({ filterBy: value })}
        filterOptions={filterOptions}
        sortValue={filters.sortBy}
        onSortChange={(value) => handleFiltersChange({ sortBy: value })}
        sortOrder={filters.sortOrder}
        onSortOrderChange={(value) => handleFiltersChange({ sortOrder: value })}
        totalCount={customers.length}
        filteredCount={filteredCustomers.length}
        onExport={handleExport}
        exportLabel="Export Customers"
      />

      <GenericDataTable
        data={filteredCustomers}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No customers found matching your filters."
      />

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onOpenChange={(open) => !open && setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default CustomersManager;