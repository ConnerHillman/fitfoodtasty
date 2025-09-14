import { useMemo } from "react";
import type { Customer, CustomerFilters } from "@/types/customer";

export const useFilteredCustomers = (customers: Customer[], filters: CustomerFilters) => {
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.full_name.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term) ||
        customer.city.toLowerCase().includes(term) ||
        customer.postal_code.toLowerCase().includes(term)
      );
    }

    // Apply filter by type
    if (filters.filterBy !== "all") {
      switch (filters.filterBy) {
        case "with_orders":
          filtered = filtered.filter(c => c.total_orders > 0);
          break;
        case "no_orders":
          filtered = filtered.filter(c => c.total_orders === 0);
          break;
        case "high_value":
          filtered = filtered.filter(c => c.total_spent > 200);
          break;
        case "recent":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filtered = filtered.filter(c => 
            c.last_order_date && new Date(c.last_order_date) > thirtyDaysAgo
          );
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof Customer];
      let bValue: any = b[filters.sortBy as keyof Customer];

      // Handle date sorting
      if (filters.sortBy === "created_at" || filters.sortBy === "last_order_date") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle string sorting
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [customers, filters]);

  return filteredCustomers;
};