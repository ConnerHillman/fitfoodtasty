import { useMemo } from "react";
import type { BaseFilters, EntityStatus } from "@/types/common";

// Generic filtering hook that can be used for any data type
export const useFilteredData = <T>(
  data: T[],
  filters: BaseFilters & {
    searchFields?: (keyof T)[];
    statusField?: keyof T;
    statusFilter?: EntityStatus;
    customFilter?: (item: T) => boolean;
  }
) => {
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (filters.searchTerm?.trim() && filters.searchFields) {
      const term = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        filters.searchFields!.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(term);
        })
      );
    }

    // Apply status filter
    if (filters.statusFilter && filters.statusFilter !== 'all' && filters.statusField) {
      const isActive = filters.statusFilter === 'active';
      filtered = filtered.filter(item => {
        const statusValue = item[filters.statusField!];
        return Boolean(statusValue) === isActive;
      });
    }

    // Apply custom filter
    if (filters.customFilter) {
      filtered = filtered.filter(filters.customFilter);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof T];
        const bValue = b[filters.sortBy as keyof T];

        // Handle date sorting
        if (filters.sortBy.includes('date') || filters.sortBy === 'created_at') {
          const aTime = aValue ? new Date(aValue as string).getTime() : 0;
          const bTime = bValue ? new Date(bValue as string).getTime() : 0;
          return filters.sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }

        // Handle string sorting
        if (typeof aValue === "string") {
          const aStr = aValue.toLowerCase();
          const bStr = String(bValue).toLowerCase();
          if (filters.sortOrder === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
          }
        }

        // Handle numeric sorting
        const aNum = Number(aValue) || 0;
        const bNum = Number(bValue) || 0;
        return filters.sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      });
    }

    return filtered;
  }, [data, filters]);

  return filteredData;
};