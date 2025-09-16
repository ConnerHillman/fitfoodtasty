import { useMemo } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

export function useOptimizedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceMs: number = 300
): T[] {
  const debouncedSearchTerm = useDebouncedValue(searchTerm, debounceMs);

  return useMemo(() => {
    if (!debouncedSearchTerm || !debouncedSearchTerm.trim()) {
      return data;
    }

    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      })
    );
  }, [data, debouncedSearchTerm, searchFields]);
}