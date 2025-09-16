import { CustomerCardView } from "./CustomerCardView";
import { ResponsiveCustomerTable } from "./ResponsiveCustomerTable";
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
  if (filters.viewMode === "card") {
    return (
      <CustomerCardView
        customers={customers}
        getCustomerValue={getCustomerValue}
        loading={loading}
      />
    );
  }

  return (
    <ResponsiveCustomerTable
      customers={customers}
      loading={loading}
    />
  );
}