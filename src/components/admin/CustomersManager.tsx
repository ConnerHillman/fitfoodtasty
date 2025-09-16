import { useState, useEffect } from "react";
import { RefreshCw, Users, UserPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCustomersData } from "@/hooks/useCustomersData";
import { useFilteredCustomers } from "@/hooks/useFilteredCustomers";
import { GenericDataTable } from "@/components/common/GenericDataTable";
import { StatsCardsGrid } from "@/components/common/StatsCards";
import { CustomerFiltersBar } from "./customers/CustomerFiltersBar";
import { CustomerCardView } from "./customers/CustomerCardView";
import AddCustomerDialog from "./AddCustomerDialog";
import CustomerLink from "./CustomerLink";
import CustomerDetailModal from "./CustomerDetailModal";
import { CustomerErrorBoundary } from "@/components/common/CustomerErrorBoundary";

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
      key: "full_name",
      header: "Name",
      sortable: true,
      cell: (value: any, customer: any) => (
        <div>
          <CustomerLink 
            customerId={customer.user_id} 
            customerName={customer.full_name}
            customerData={customer}
            className="font-medium"
          />
          <div className="text-sm text-muted-foreground">{customer.email || 'No email'}</div>
        </div>
      ),
    },
    {
      key: "total_orders",
      header: "Orders",
      sortable: true,
      cell: (value: any, customer: any) => customer.total_orders || 0,
    },
    {
      key: "total_spent",
      header: "Total Spent",
      sortable: true,
      cell: (value: any, customer: any) => `£${(customer.total_spent || 0).toFixed(2)}`,
    },
    {
      key: "last_order_date",
      header: "Last Order",
      sortable: true,
      cell: (value: any, customer: any) => 
        customer.last_order_date 
          ? new Date(customer.last_order_date).toLocaleDateString()
          : 'Never',
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      cell: (value: any, customer: any) => new Date(customer.created_at).toLocaleDateString(),
    },
  ];

  const customerActions = [];


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customers...</span>
      </div>
    );
  }

  return (
    <CustomerErrorBoundary onRetry={() => fetchCustomers(filters.dateRange)}>
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
            <CustomerErrorBoundary>
              <AddCustomerDialog onCustomerAdded={handleRefresh} />
            </CustomerErrorBoundary>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <CustomerErrorBoundary>
          <StatsCardsGrid stats={statsData} />
        </CustomerErrorBoundary>

        {/* Filters */}
        <CustomerErrorBoundary>
          <CustomerFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={customers.length}
        filteredCount={filteredCustomers.length}
            onExport={handleExport}
          />
        </CustomerErrorBoundary>

        {/* Data Display */}
        <CustomerErrorBoundary>
          {filters.viewMode === "card" ? (
            <CustomerCardView
              customers={filteredCustomers}
              getCustomerValue={getCustomerValue}
            />
          ) : (
            <GenericDataTable
              data={filteredCustomers}
              columns={tableColumns}
              actions={customerActions}
              loading={loading}
              emptyMessage="No customers found matching your filters."
            />
          )}
        </CustomerErrorBoundary>

        {/* Customer Detail Modal */}
        <CustomerDetailModal />
      </div>
    </CustomerErrorBoundary>
  );
};

export default CustomersManager;