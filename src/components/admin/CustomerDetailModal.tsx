import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCustomerDetail } from "@/contexts/CustomerDetailContext";
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingCart, 
  Package,
  Calendar,
  TrendingUp,
  Clock,
  CreditCard,
  RefreshCw,
  Activity,
  Eye,
  Star
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
  items_count: number;
  currency: string;
  items?: Array<{
    meal_name: string;
    quantity: number;
    unit_price: number;
  }>;
  package_name?: string;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  daysSinceLastOrder?: number;
  favoriteItems: Array<{
    name: string;
    orderCount: number;
  }>;
  orderFrequency: number; // orders per month
  customerLifetimeValue: number;
  ordersByMonth: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

interface PageView {
  id: string;
  created_at: string;
  page_type: string;
  page_id?: string;
}

interface AbandonedCart {
  id: string;
  created_at: string;
  total_amount: number;
  cart_items: any;
  recovered_at?: string;
}

const CustomerDetailModal = () => {
  const { isOpen, customerId, closeCustomerDetail } = useCustomerDetail();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      // First, try to find customer by user_id (if customerId is a user_id)
      let customerData = null;
      
      // Try to get profile by user_id first
      const { data: profileByUserId } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", customerId)
        .single();

      if (profileByUserId) {
        customerData = profileByUserId;
      } else {
        // If not found by user_id, try by profile id
        const { data: profileById } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", customerId)
          .single();
        
        customerData = profileById;
      }

      if (!customerData) {
        // If still not found, try to find by matching customer names in orders
        const { data: orderWithCustomer } = await supabase
          .from("orders")
          .select("user_id, customer_name, customer_email")
          .or(`customer_name.eq.${customerId},customer_email.eq.${customerId}`)
          .limit(1)
          .single();

        if (orderWithCustomer?.user_id) {
          const { data: profileByOrderUserId } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", orderWithCustomer.user_id)
            .single();
          
          customerData = profileByOrderUserId;
        }
      }

      if (!customerData) {
        toast({
          title: "Customer Not Found",
          description: "Could not find customer details",
          variant: "destructive",
        });
        closeCustomerDetail();
        return;
      }

      setCustomer(customerData);

      // Fetch orders
      await Promise.all([
        fetchCustomerOrders(customerData.user_id),
        fetchCustomerStats(customerData.user_id),
        fetchPageViews(customerData.user_id),
        fetchAbandonedCarts(customerData.user_id),
      ]);

    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (userId: string) => {
    try {
      // Fetch regular orders
      const { data: regularOrders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            meal_name,
            quantity,
            unit_price
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch package orders
      const { data: packageOrders, error: packageOrdersError } = await supabase
        .from("package_orders")
        .select(`
          *,
          packages (name),
          package_meal_selections (
            quantity,
            meals (name)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError || packageOrdersError) {
        throw ordersError || packageOrdersError;
      }

      const formattedOrders: CustomerOrder[] = [
        ...(regularOrders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: parseFloat(String(order.total_amount)),
          status: order.status,
          type: 'order' as const,
          items_count: order.order_items?.length || 0,
          currency: order.currency || 'gbp',
          items: order.order_items?.map((item: any) => ({
            meal_name: item.meal_name,
            quantity: item.quantity,
            unit_price: parseFloat(String(item.unit_price)),
          })) || [],
        })),
        ...(packageOrders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: parseFloat(String(order.total_amount)),
          status: order.status,
          type: 'package_order' as const,
          items_count: order.package_meal_selections?.length || 0,
          currency: order.currency || 'gbp',
          package_name: order.packages?.name || 'Package',
          items: order.package_meal_selections?.map((selection: any) => ({
            meal_name: selection.meals?.name || 'Unknown Meal',
            quantity: selection.quantity,
            unit_price: 0, // Package items don't have individual prices
          })) || [],
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    }
  };

  const fetchCustomerStats = async (userId: string) => {
    try {
      // Get all orders for stats calculation
      const { data: allOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId);

      const { data: allPackageOrders } = await supabase
        .from("package_orders")
        .select("*")
        .eq("user_id", userId);

      const combinedOrders = [...(allOrders || []), ...(allPackageOrders || [])];

      if (combinedOrders.length === 0) {
        setStats({
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          favoriteItems: [],
          orderFrequency: 0,
          customerLifetimeValue: 0,
          ordersByMonth: [],
        });
        return;
      }

      const totalSpent = combinedOrders.reduce((sum, order) => sum + parseFloat(String(order.total_amount || 0)), 0);
      const sortedOrders = combinedOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstOrderDate = sortedOrders[0].created_at;
      const lastOrderDate = sortedOrders[sortedOrders.length - 1].created_at;
      const daysSinceLastOrder = differenceInDays(new Date(), new Date(lastOrderDate));
      
      // Calculate order frequency (orders per month)
      const daysSinceFirst = differenceInDays(new Date(lastOrderDate), new Date(firstOrderDate)) || 1;
      const monthsSinceFirst = daysSinceFirst / 30.44; // Average days per month
      const orderFrequency = monthsSinceFirst > 0 ? combinedOrders.length / monthsSinceFirst : 0;

      // Get favorite items (would need to join with order items - simplified for now)
      const favoriteItems: Array<{ name: string; orderCount: number }> = [];

      // Group orders by month
      const ordersByMonth = combinedOrders.reduce((acc, order) => {
        const monthKey = format(new Date(order.created_at), 'yyyy-MM');
        const existing = acc.find(item => item.month === monthKey);
        
        if (existing) {
          existing.orders += 1;
          existing.revenue += parseFloat(String(order.total_amount || 0));
        } else {
          acc.push({
            month: monthKey,
            orders: 1,
            revenue: parseFloat(String(order.total_amount || 0)),
          });
        }
        
        return acc;
      }, [] as Array<{ month: string; orders: number; revenue: number }>);

      setStats({
        totalOrders: combinedOrders.length,
        totalSpent,
        averageOrderValue: totalSpent / combinedOrders.length,
        firstOrderDate,
        lastOrderDate,
        daysSinceLastOrder,
        favoriteItems,
        orderFrequency,
        customerLifetimeValue: totalSpent, // Simplified calculation
        ordersByMonth: ordersByMonth.sort((a, b) => a.month.localeCompare(b.month)),
      });

    } catch (error) {
      console.error("Error fetching customer stats:", error);
    }
  };

  const fetchPageViews = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPageViews(data || []);
    } catch (error) {
      console.error("Error fetching page views:", error);
    }
  };

  const fetchAbandonedCarts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAbandonedCarts(data || []);
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
    }
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  const getCustomerSegment = () => {
    if (!stats) return "New";
    if (stats.totalSpent > 500) return "VIP";
    if (stats.totalSpent > 200) return "High Value";
    if (stats.totalOrders > 5) return "Loyal";
    return "Regular";
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => closeCustomerDetail()}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading customer details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.totalSpent || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.averageOrderValue || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Order Frequency</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats?.orderFrequency || 0).toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">orders/month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            <OrderLink orderId={order.id}>
                              {order.id.slice(0, 8)}...
                            </OrderLink>
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "MMM dd, yyyy")}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Orders ({orders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
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
                          <TableCell>
                            <div className="text-sm">
                              {order.items?.slice(0, 2).map((item, idx) => (
                                <div key={idx}>
                                  {item.meal_name} (x{item.quantity})
                                </div>
                              ))}
                              {order.items && order.items.length > 2 && (
                                <div className="text-muted-foreground">
                                  +{order.items.length - 2} more...
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Page Views ({pageViews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {pageViews.map((view) => (
                          <div key={view.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="text-sm">{view.page_type}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(view.created_at), "MMM dd, HH:mm")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Abandoned Carts ({abandonedCarts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {abandonedCarts.map((cart) => (
                          <div key={cart.id} className="p-2 bg-muted/30 rounded">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{formatCurrency(cart.total_amount)}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(cart.created_at), "MMM dd, yyyy")}
                              </span>
                            </div>
                            {cart.recovered_at && (
                              <Badge variant="default" className="mt-1 text-xs">
                                Recovered
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Customer Segment</h4>
                      <Badge variant="default" className="text-base px-3 py-1">
                        {getCustomerSegment()}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Customer Lifetime Value</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats?.customerLifetimeValue || 0)}
                      </div>
                    </div>
                  </div>

                  {stats?.ordersByMonth && stats.ordersByMonth.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Monthly Order History</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.ordersByMonth.map((month) => (
                            <TableRow key={month.month}>
                              <TableCell>{format(new Date(month.month + '-01'), "MMMM yyyy")}</TableCell>
                              <TableCell>{month.orders}</TableCell>
                              <TableCell>{formatCurrency(month.revenue)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{customer.full_name}</div>
                          <div className="text-sm text-muted-foreground">Full Name</div>
                        </div>
                      </div>

                      {customer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{customer.phone}</div>
                            <div className="text-sm text-muted-foreground">Phone Number</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(customer.created_at), "MMMM dd, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">Customer Since</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <div className="font-medium">Delivery Address</div>
                          <div className="text-sm text-muted-foreground whitespace-pre-line">
                            {customer.delivery_address}
                            {customer.city && `\n${customer.city}`}
                            {customer.postal_code && `, ${customer.postal_code}`}
                            {customer.county && `\n${customer.county}`}
                          </div>
                          {customer.delivery_instructions && (
                            <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                              <div className="font-medium text-muted-foreground mb-1">Delivery Instructions:</div>
                              <div>{customer.delivery_instructions}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailModal;