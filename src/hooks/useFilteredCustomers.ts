import { useFilteredData } from "./useFilteredData";
import type { Customer, CustomerFilters } from "@/types/customer";

export const useFilteredCustomers = (customers: Customer[], filters: CustomerFilters) => {
  return useFilteredData(customers, {
    searchTerm: filters.searchTerm,
    searchFields: ['full_name', 'email', 'phone', 'city', 'postal_code'] as (keyof Customer)[],
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    customFilter: (customer: Customer) => {
      // Apply filter by type
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
    }
  });
};