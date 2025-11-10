import { useMemo } from 'react';
import { useEnhancedDataManager } from './useEnhancedDataManager';
import { useFilteredData } from './useFilteredData';
import { usePaginatedData } from './usePaginatedData';

export interface Package {
  id: string;
  name: string;
  description?: string;
  meal_count: number;
  price: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

interface PackageFilters {
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statusFilter?: 'all' | 'active' | 'inactive';
}

export const useStandardizedPackagesData = (filters: PackageFilters = {}) => {
  const {
    data: packages,
    loading,
    error,
    total,
    lastFetched,
    create,
    update,
    remove,
    toggle,
    refetch,
    invalidateCache
  } = useEnhancedDataManager<Package>('packages', {
    orderBy: { column: 'sort_order', ascending: true },
    select: '*'
  });

  // Apply filters
  const filteredPackages = useFilteredData(packages, {
    searchTerm: filters.searchTerm || '',
    sortBy: filters.sortBy || 'sort_order',
    sortOrder: filters.sortOrder || 'asc',
    statusFilter: filters.statusFilter || 'all',
    searchFields: ['name', 'description'],
    statusField: 'is_active',
    customFilter: (pkg) => {
      if (filters.statusFilter === 'active') return pkg.is_active;
      if (filters.statusFilter === 'inactive') return !pkg.is_active;
      return true;
    }
  });

  // Setup pagination
  const {
    paginatedResult,
    goToPage,
    setPageSize
  } = usePaginatedData(filteredPackages, 50);

  const paginatedPackages = paginatedResult.data;
  const currentPage = paginatedResult.pagination.page;
  const totalPages = paginatedResult.totalPages;

  // Stats
  const stats = useMemo(() => ({
    total: packages.length,
    active: packages.filter(p => p.is_active).length,
    inactive: packages.filter(p => !p.is_active).length,
    filtered: filteredPackages.length
  }), [packages, filteredPackages]);

  return {
    // Data
    allPackages: packages,
    filteredPackages,
    paginatedPackages,
    
    // State
    loading,
    error,
    total,
    lastFetched,
    stats,
    
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    setPageSize,
    
    // CRUD operations
    createPackage: create,
    updatePackage: update,
    deletePackage: remove,
    toggleActive: (id: string) => toggle(id, 'is_active'),
    
    // Cache management
    refetch,
    invalidateCache
  };
};
