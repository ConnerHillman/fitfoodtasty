import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "./useErrorHandler";
import { useToast } from "./use-toast";
import { useCustomerCache } from "./useCustomerCache";
import { useFilteredData } from "./useFilteredData";
import { usePaginatedData } from "./usePaginatedData";
import { sanitizeCustomerForDisplay } from "@/lib/customerValidation";
import { startOfDay, endOfDay, subDays } from "date-fns";
import type { Customer, CustomerFilters, CustomerStats } from "@/types/customer";
import type { DateRange } from "@/types/common";
import type { ApiError } from "@/types/api";

export const useStandardizedCustomersData = (filters: CustomerFilters) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  
  const { handleAndShowError } = useErrorHandler();
  const { toast } = useToast();
  const cache = useCustomerCache();

  // Enhanced fetch with better error handling
  const fetchCustomers = useCallback(async (dateRange: DateRange, forceRefresh: boolean = false): Promise<Customer[]> => {
    try {
      setError(null);
      
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = cache.getCachedData(dateRange);
        if (cachedData) {
          setCustomers(cachedData);
          return cachedData;
        }
      }
      
      setLoading(true);
      const from = startOfDay(dateRange.from);
      const to = endOfDay(dateRange.to);

      // Get all profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      if (profilesError) throw profilesError;

      // Get all profile user IDs for batch order fetching
      const profileUserIds = profiles?.map(p => p.user_id) || [];
      
      // Batch fetch orders and package orders for all profiles
      const [ordersResult, packageOrdersResult] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .in("user_id", profileUserIds),
        supabase
          .from("package_orders")
          .select("*")
          .in("user_id", profileUserIds)
      ]);

      if (ordersResult.error || packageOrdersResult.error) {
        throw ordersResult.error || packageOrdersResult.error;
      }

      // Group orders by user_id for efficient lookup
      const ordersByUser = (ordersResult.data || []).reduce((acc, order) => {
        const userId = order.user_id;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(order);
        return acc;
      }, {} as Record<string, any[]>);

      const packageOrdersByUser = (packageOrdersResult.data || []).reduce((acc, order) => {
        const userId = order.user_id;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(order);
        return acc;
      }, {} as Record<string, any[]>);

      // Build customer data with email from first order if available
      const customerData: Customer[] = [];

      for (const profile of profiles || []) {
        const orders = ordersByUser[profile.user_id] || [];
        const packageOrders = packageOrdersByUser[profile.user_id] || [];
        const allOrders = [...orders, ...packageOrders];
        
        const totalSpent = allOrders.reduce((sum, order) => sum + parseFloat(String(order.total_amount || 0)), 0);
        const lastOrderDate = allOrders.length > 0 
          ? allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : undefined;

        // Get email using priority-based selection
        let customerEmail: string | undefined;
        
        // 1. First priority: Find orders where customer_name matches profile full_name
        const matchingNameOrder = allOrders.find(order => 
          order.customer_email && order.customer_name === profile.full_name
        );
        
        if (matchingNameOrder) {
          customerEmail = matchingNameOrder.customer_email;
        } else {
          // 2. Second priority: Most frequently used email in this user's orders
          const emailCounts: Record<string, number> = {};
          allOrders.forEach(order => {
            if (order.customer_email) {
              emailCounts[order.customer_email] = (emailCounts[order.customer_email] || 0) + 1;
            }
          });
          
          if (Object.keys(emailCounts).length > 0) {
            // Get the email with the highest count
            customerEmail = Object.entries(emailCounts)
              .sort(([,a], [,b]) => b - a)[0][0];
          }
        }

        customerData.push({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name || 'Unknown',
          phone: profile.phone || '',
          delivery_address: profile.delivery_address || '',
          city: profile.city || '',
          postal_code: profile.postal_code || '',
          county: profile.county || '',
          email: customerEmail,
          created_at: profile.created_at,
          total_orders: allOrders.length,
          total_spent: totalSpent,
          last_order_date: lastOrderDate,
          order_count: orders?.length || 0,
          package_order_count: packageOrders?.length || 0,
        });
      }

      // Sanitize data for display safety
      const sanitizedCustomers = customerData.map(sanitizeCustomerForDisplay);
      setCustomers(sanitizedCustomers);
      setLastFetched(new Date());
      
      // Cache the results
      cache.setCachedData(sanitizedCustomers, dateRange, filters);
      
      return sanitizedCustomers;

    } catch (error: any) {
      const apiError = handleAndShowError(error, "Customer Data Fetch", "Failed to fetch customers");
      setError(apiError);
      return [];
    } finally {
      setLoading(false);
    }
  }, [cache, filters, handleAndShowError]);

  // Apply filtering to customers
  const filteredCustomers = useFilteredData(customers, {
    searchTerm: filters.searchTerm,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    searchFields: ['full_name', 'email', 'phone', 'city'] as (keyof Customer)[],
    customFilter: filters.filterBy !== 'all' 
      ? (customer: Customer) => {
          if (filters.filterBy === 'with_orders') return customer.total_orders > 0;
          if (filters.filterBy === 'no_orders') return customer.total_orders === 0;
          if (filters.filterBy === 'high_value') return customer.total_spent > 200;
          if (filters.filterBy === 'recent') {
            return customer.last_order_date && 
              new Date(customer.last_order_date) > subDays(new Date(), 30);
          }
          return true;
        }
      : undefined
  });

  // Apply pagination
  const paginatedCustomers = usePaginatedData(filteredCustomers, 50);

  // Calculate customer statistics
  const getCustomerStats = useCallback((customers: Customer[]): CustomerStats => {
    const customersWithOrders = customers.filter(c => c.total_orders > 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    
    const averageOrderValue = customersWithOrders.length > 0 
      ? totalRevenue / customersWithOrders.length 
      : 0;

    const stats = {
      total: customers.length,
      withOrders: customersWithOrders.length,
      totalRevenue,
      averageOrderValue,
      activeCustomers: customers.filter(c => c.last_order_date && 
        new Date(c.last_order_date) > subDays(new Date(), 30)).length
    };

    return {
      ...stats,
      averageOrderValue: isNaN(stats.averageOrderValue) ? 0 : stats.averageOrderValue
    };
  }, []);

  const getCustomerValue = useCallback((customer: Customer): "high" | "medium" | "low" => {
    if (customer.total_spent > 200 || customer.total_orders > 10) return "high";
    if (customer.total_spent > 50 || customer.total_orders > 3) return "medium";
    return "low";
  }, []);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchCustomers(filters.dateRange).catch(() => {
      // Error already handled in fetchCustomers
    });
  }, [fetchCustomers, filters.dateRange]);

  return {
    // Data
    customers: paginatedCustomers.paginatedResult.data,
    allCustomers: filteredCustomers,
    
    // States
    loading,
    error,
    lastFetched,
    
    // Pagination
    pagination: paginatedCustomers.paginatedResult.pagination,
    totalPages: paginatedCustomers.paginatedResult.totalPages,
    hasNextPage: paginatedCustomers.paginatedResult.hasNextPage,
    hasPreviousPage: paginatedCustomers.paginatedResult.hasPreviousPage,
    goToPage: paginatedCustomers.goToPage,
    nextPage: paginatedCustomers.nextPage,
    previousPage: paginatedCustomers.previousPage,
    
    // Methods
    fetchCustomers,
    getCustomerStats: () => getCustomerStats(filteredCustomers),
    getCustomerValue,
    invalidateCache: () => cache.invalidateCache(),
    refetch: () => fetchCustomers(filters.dateRange, true)
  };
};