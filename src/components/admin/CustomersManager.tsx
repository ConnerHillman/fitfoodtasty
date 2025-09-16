import { useState, useEffect } from "react";
import { RefreshCw, Users, UserPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useCustomersData } from "@/hooks/useCustomersData";
import { useFilteredCustomers } from "@/hooks/useFilteredCustomers";
import { GenericDataTable } from "@/components/common/GenericDataTable";
import { StatsCardsGrid } from "@/components/common/StatsCards";
import { GenericModal } from "@/components/common/GenericModal";
import { CustomerFiltersBar } from "./customers/CustomerFiltersBar";
import { CustomerCardView } from "./customers/CustomerCardView";
import AddCustomerDialog from "./AddCustomerDialog";

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
      key: "full_name",
      header: "Name",
      sortable: true,
      cell: (value: any, customer: any) => (
        <div>
          <div className="font-medium">{customer.full_name}</div>
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
      key: "created_at",
      header: "Joined",
      sortable: true,
      cell: (value: any, customer: any) => new Date(customer.created_at).toLocaleDateString(),
    },
  ];

  const customerActions = [
    {
      label: "View Details",
      onClick: (customer: any) => setSelectedCustomer(customer),
    },
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

      {/* Filters */}
      <CustomerFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={customers.length}
        filteredCount={filteredCustomers.length}
        onExport={handleExport}
      />

      {/* Data Display */}
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <GenericModal
          open={!!selectedCustomer}
          onOpenChange={(open) => !open && setSelectedCustomer(null)}
          title={`Customer Details: ${selectedCustomer.full_name}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">{selectedCustomer.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email || 'No email'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Orders</label>
                <p className="text-sm text-muted-foreground">{selectedCustomer.total_orders || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Spent</label>
                <p className="text-sm text-muted-foreground">£{(selectedCustomer.total_spent || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Joined</label>
                <p className="text-sm text-muted-foreground">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </GenericModal>
      )}
    </div>
  );
};

export default CustomersManager;