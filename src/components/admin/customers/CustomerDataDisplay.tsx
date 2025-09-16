import { CustomerCardView } from "./CustomerCardView";
import { GenericDataTable } from "@/components/common/GenericDataTable";
import CustomerLink from "../CustomerLink";
import type { Customer, CustomerFilters } from "@/types/customer";

interface CustomerDataDisplayProps {
  customers: Customer[];
  filters: CustomerFilters;
  loading: boolean;
  getCustomerValue: (customer: Customer) => "high" | "medium" | "low";
}

export function CustomerDataDisplay({ 
  customers, 
  filters, 
  loading, 
  getCustomerValue 
}: CustomerDataDisplayProps) {
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

  if (filters.viewMode === "card") {
    return (
      <CustomerCardView
        customers={customers}
        getCustomerValue={getCustomerValue}
      />
    );
  }

  return (
    <GenericDataTable
      data={customers}
      columns={tableColumns}
      actions={[]}
      loading={loading}
      emptyMessage="No customers found matching your filters."
    />
  );
}