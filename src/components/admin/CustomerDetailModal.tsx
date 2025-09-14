import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCustomerDetail } from "@/contexts/ModalContext";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, formatCustomerSegment } from "@/lib/utils";

// Import decomposed components
import { CustomerStatsCards } from "./customer-detail/CustomerStatsCards";
import { CustomerRecentOrders } from "./customer-detail/CustomerRecentOrders";
import { CustomerContactInfo } from "./customer-detail/CustomerContactInfo";
import { CustomerActivityFeed } from "./customer-detail/CustomerActivityFeed";
import { CustomerAnalytics } from "./customer-detail/CustomerAnalytics";

import OrderLink from "./OrderLink";
import OrderStatusBadge from "./OrderStatusBadge";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  delivery_instructions: string;
  city: string;
  postal_code: string;
  county: string;
  created_at: string;
}

interface CustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  type: 'order' | 'package_order';
  items_count?: number;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  orderFrequency: number;
  daysSinceLastOrder?: number;
  customerLifetimeValue?: number;
}

interface MonthlyRevenue {
  month: string;
  orders: number;
  revenue: number;
}

interface ActivityItem {
  id: string;
  created_at: string;
  type: 'view' | 'cart_abandoned' | 'order';
  page?: string;
  total_amount?: number;
}

const CustomerDetailModal = () => {
  const { toast } = useToast();
  const { isOpen, data: customerId, close: closeCustomerDetail } = useCustomerDetail();

  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (customerId && isOpen) {
      fetchAllCustomerData();
    }
  }, [customerId, isOpen]);

  // Fetch stats and other data when orders change
  useEffect(() => {
    if (orders.length > 0) {
      fetchStats();
      fetchMonthlyRevenue();
      fetchActivities();
    }
  }, [orders]);

  const fetchAllCustomerData = async () => {
    if (!customerId) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchCustomerProfile(),
        fetchOrders(),
        fetchEmail()
      ]);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async () => {
    if (!customerId) return;

    try {
      // Get user from auth
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(customerId);
      if (authError) throw authError;

      // Create a minimal customer profile from available data
      if (authData?.user) {
        setCustomer({
          id: authData.user.id,
          user_id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || authData.user.email || 'Unknown',
          phone: authData.user.user_metadata?.phone || '',
          delivery_address: authData.user.user_metadata?.delivery_address || '',
          delivery_instructions: '',
          city: authData.user.user_metadata?.city || '',
          postal_code: authData.user.user_metadata?.postal_code || '',
          county: '',
          created_at: authData.user.created_at
        });
      }
    } catch (error) {
      console.error("Error fetching customer profile:", error);
    }
  };

  const fetchOrders = async () => {
    if (!customerId) return;

    try {
      // Fetch regular orders
      const { data: regularOrders, error: regularError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          order_items(id)
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      if (regularError) throw regularError;

      // Fetch package orders
      const { data: packageOrders, error: packageError } = await supabase
        .from('package_orders')
        .select(`
          id,
          created_at,
          total_amount,
          status
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      if (packageError) throw packageError;

      // Format and combine orders
      const formattedOrders: CustomerOrder[] = [
        ...(regularOrders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: order.total_amount,
          status: order.status,
          type: 'order' as const,
          items_count: order.order_items?.length || 0
        })),
        ...(packageOrders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: order.total_amount,
          status: order.status,
          type: 'package_order' as const,
          items_count: 1
        }))
      ];

      // Sort by creation date
      formattedOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchStats = async () => {
    if (orders.length === 0) return;

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const averageOrderValue = totalSpent / totalOrders;

    // Calculate order frequency (orders per month)
    const firstOrderDate = new Date(orders[orders.length - 1]?.created_at);
    const monthsDiff = Math.max(1, (Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const orderFrequency = totalOrders / monthsDiff;

    // Days since last order
    const lastOrderDate = orders[0]?.created_at;
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Customer lifetime value estimate
    const customerLifetimeValue = averageOrderValue * orderFrequency * 12; // Annual estimate

    setStats({
      totalOrders,
      totalSpent,
      averageOrderValue,
      orderFrequency,
      daysSinceLastOrder,
      customerLifetimeValue
    });
  };

  const fetchMonthlyRevenue = async () => {
    if (orders.length === 0) return;

    // Group orders by month
    const monthlyData: { [key: string]: { orders: number; revenue: number } } = {};

    orders.forEach(order => {
      const monthKey = format(new Date(order.created_at), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { orders: 0, revenue: 0 };
      }
      monthlyData[monthKey].orders += 1;
      monthlyData[monthKey].revenue += order.total_amount;
    });

    const monthlyRevenue = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months

    setMonthlyRevenue(monthlyRevenue);
  };

  const fetchActivities = async () => {
    if (!customerId) return;

    try {
      // Fetch abandoned carts
      const { data: carts, error: cartsError } = await supabase
        .from('abandoned_carts')
        .select('id, created_at, total_amount')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (cartsError) throw cartsError;

      // Combine and format activities
      const allActivities: ActivityItem[] = [
        ...(carts || []).map(cart => ({
          id: cart.id,
          created_at: cart.created_at,
          type: 'cart_abandoned' as const,
          total_amount: cart.total_amount
        })),
        ...orders.slice(0, 10).map(order => ({
          id: order.id,
          created_at: order.created_at,
          type: 'order' as const,
          total_amount: order.total_amount
        }))
      ];

      // Sort by creation date
      allActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(allActivities.slice(0, 20));
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchEmail = async () => {
    if (!customerId) return;

    try {
      const { data, error } = await supabase.auth.admin.getUserById(customerId);
      if (error) throw error;
      setEmail(data?.user?.email || "");
    } catch (error) {
      console.error("Error fetching email:", error);
    }
  };

  const getCustomerSegment = () => {
    if (!stats) return "New";
    return formatCustomerSegment(stats.totalSpent, stats.totalOrders);
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => closeCustomerDetail()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{customer.full_name}</DialogTitle>
              <DialogDescription>
                Customer since {format(new Date(customer.created_at), "MMMM dd, yyyy")}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {getCustomerSegment()}
              </Badge>
              {stats && stats.daysSinceLastOrder !== undefined && (
                <Badge variant={stats.daysSinceLastOrder > 30 ? "destructive" : "default"}>
                  {stats.daysSinceLastOrder === 0 ? "Active Today" : 
                   stats.daysSinceLastOrder === 1 ? "Active Yesterday" :
                   `${stats.daysSinceLastOrder} days ago`}
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAllCustomerData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <CustomerStatsCards stats={stats} />
              <CustomerRecentOrders orders={orders} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Orders ({orders.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          <OrderLink orderId={order.id}>
                            {order.id.slice(0, 8)}...
                          </OrderLink>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.type === 'order' ? 'Meal' : 'Package'}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.items_count}</TableCell>
                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              <CustomerActivityFeed activities={activities} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <CustomerAnalytics stats={stats} monthlyRevenue={monthlyRevenue} />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
              <CustomerContactInfo customer={customer} email={email} />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailModal;