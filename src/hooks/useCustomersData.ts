import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfDay, endOfDay, subDays } from "date-fns";
import type { Customer, CustomerFilters } from "@/types/customer";

export const useCustomersData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async (dateRange: { from: Date; to: Date }) => {
    setLoading(true);
    try {
      const from = startOfDay(dateRange.from);
      const to = endOfDay(dateRange.to);

      // Get all profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      if (profilesError) throw profilesError;

      // Get order statistics for each customer
      const customerData: Customer[] = [];

      for (const profile of profiles || []) {
        // Get regular orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", profile.user_id.toString());

        // Get package orders
        const { data: packageOrders, error: packageOrdersError } = await supabase
          .from("package_orders")
          .select("*")
          .eq("user_id", profile.user_id.toString());

        if (ordersError || packageOrdersError) {
          console.error("Error fetching orders:", ordersError || packageOrdersError);
          continue;
        }

        const allOrders = [...(orders || []), ...(packageOrders || [])];
        const totalSpent = allOrders.reduce((sum, order) => sum + parseFloat(String(order.total_amount || 0)), 0);
        const lastOrderDate = allOrders.length > 0 
          ? allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : undefined;

        customerData.push({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name || 'Unknown',
          phone: profile.phone || '',
          delivery_address: profile.delivery_address || '',
          city: profile.city || '',
          postal_code: profile.postal_code || '',
          county: profile.county || '',
          email: undefined, // Can't access auth.users directly
          created_at: profile.created_at,
          total_orders: allOrders.length,
          total_spent: totalSpent,
          last_order_date: lastOrderDate,
          order_count: orders?.length || 0,
          package_order_count: packageOrders?.length || 0,
        });
      }

      setCustomers(customerData);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomerStats = (customers: Customer[]) => {
    const stats = {
      total: customers.length,
      withOrders: customers.filter(c => c.total_orders > 0).length,
      totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
      averageOrderValue: customers.length > 0 
        ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.filter(c => c.total_orders > 0).length 
        : 0,
      activeCustomers: customers.filter(c => c.last_order_date && 
        new Date(c.last_order_date) > subDays(new Date(), 30)).length
    };

    return {
      ...stats,
      averageOrderValue: isNaN(stats.averageOrderValue) ? 0 : stats.averageOrderValue
    };
  };

  const getCustomerValue = (customer: Customer): "high" | "medium" | "low" => {
    if (customer.total_spent > 200 || customer.total_orders > 10) return "high";
    if (customer.total_spent > 50 || customer.total_orders > 3) return "medium";
    return "low";
  };

  return {
    customers,
    loading,
    fetchCustomers,
    getCustomerStats,
    getCustomerValue,
    refetch: (dateRange: { from: Date; to: Date }) => fetchCustomers(dateRange)
  };
};