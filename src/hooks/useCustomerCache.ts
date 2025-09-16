import { useState, useCallback, useRef } from 'react';
import type { Customer, CustomerFilters } from '@/types/customer';
import type { DateRange } from '@/types/common';

interface CacheEntry {
  data: Customer[];
  timestamp: number;
  filters: CustomerFilters;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useCustomerCache() {
  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const [loading, setLoading] = useState(false);

  const getCacheKey = (dateRange: DateRange, additionalKey?: string): string => {
    const from = dateRange.from?.toISOString() || '';
    const to = dateRange.to?.toISOString() || '';
    return `${from}-${to}${additionalKey ? `-${additionalKey}` : ''}`;
  };

  const isCacheValid = (entry: CacheEntry): boolean => {
    const now = Date.now();
    return now - entry.timestamp < CACHE_TTL;
  };

  const getCachedData = useCallback(
    (dateRange: DateRange, additionalKey?: string): Customer[] | null => {
      const key = getCacheKey(dateRange, additionalKey);
      const entry = cache.current.get(key);
      
      if (entry && isCacheValid(entry)) {
        return entry.data;
      }
      
      return null;
    },
    []
  );

  const setCachedData = useCallback(
    (
      data: Customer[], 
      dateRange: DateRange, 
      filters: CustomerFilters,
      additionalKey?: string
    ): void => {
      const key = getCacheKey(dateRange, additionalKey);
      cache.current.set(key, {
        data,
        timestamp: Date.now(),
        filters,
      });
    },
    []
  );

  const invalidateCache = useCallback((pattern?: string): void => {
    if (pattern) {
      // Remove entries matching pattern
      for (const [key] of cache.current) {
        if (key.includes(pattern)) {
          cache.current.delete(key);
        }
      }
    } else {
      // Clear entire cache
      cache.current.clear();
    }
  }, []);

  const cleanupExpiredEntries = useCallback((): void => {
    const now = Date.now();
    for (const [key, entry] of cache.current) {
      if (now - entry.timestamp >= CACHE_TTL) {
        cache.current.delete(key);
      }
    }
  }, []);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    cleanupExpiredEntries,
    loading,
    setLoading,
  };
}