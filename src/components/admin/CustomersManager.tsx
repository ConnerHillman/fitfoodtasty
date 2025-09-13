import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingCart, 
  TrendingUp, 
  Search, 
  Eye,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  city: string;
  postal_code: string;
  county: string;
  email?: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  order_count: number;
  package_order_count: number;
}

interface CustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  type: 'order' | 'package_order';
  items_count: number;
  currency: string;
}

const CustomersManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterBy, setFilterBy] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [customers, searchTerm, sortBy, sortOrder, filterBy]);

  const fetchCustomers = async () => {
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

        // Get customer email from auth if available
        let customerEmail = profile.user_id ? undefined : undefined; // We can't directly query auth.users

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

      setCustomers(customerData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (userId: string) => {
    try {
      // Fetch regular orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (count)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch package orders
      const { data: packageOrders, error: packageOrdersError } = await supabase
        .from("package_orders")
        .select(`
          *,
          package_meal_selections (count)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError || packageOrdersError) {
        throw ordersError || packageOrdersError;
      }

      const formattedOrders: CustomerOrder[] = [
        ...(orders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: parseFloat(String(order.total_amount)),
          status: order.status,
          type: 'order' as const,
          items_count: order.order_items?.[0]?.count || 0,
          currency: order.currency || 'gbp',
        })),
        ...(packageOrders || []).map(order => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: parseFloat(String(order.total_amount)),
          status: order.status,
          type: 'package_order' as const,
          items_count: order.package_meal_selections?.[0]?.count || 0,
          currency: order.currency || 'gbp',
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCustomerOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer orders",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.postal_code.includes(searchTerm)
      );
    }

    // Category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "high_value":
          filtered = filtered.filter(customer => customer.total_spent > 100);
          break;
        case "frequent":
          filtered = filtered.filter(customer => customer.total_orders >= 3);
          break;
        case "new":
          const thirtyDaysAgo = subDays(new Date(), 30);
          filtered = filtered.filter(customer => new Date(customer.created_at) > thirtyDaysAgo);
          break;
        case "no_orders":
          filtered = filtered.filter(customer => customer.total_orders === 0);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.full_name;
          bValue = b.full_name;
          break;
        case "total_spent":
          aValue = a.total_spent;
          bValue = b.total_spent;
          break;
        case "total_orders":
          aValue = a.total_orders;
          bValue = b.total_orders;
          break;
        case "last_order":
          aValue = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
          bValue = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
  };

  const getCustomerValue = (customer: Customer) => {
    if (customer.total_spent > 200) return "high";
    if (customer.total_spent > 50) return "medium";
    return "low";
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  const customerStats = {
    total: customers.length,
    withOrders: customers.filter(c => c.total_orders > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.filter(c => c.total_orders > 0).length 
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Customer Management</h2>
            <p className="text-muted-foreground">View and manage your customer base</p>
          </div>
        </div>
        <Button onClick={fetchCustomers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {customerStats.withOrders} with orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(customerStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(isNaN(customerStats.averageOrderValue) ? 0 : customerStats.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.last_order_date && 
                new Date(c.last_order_date) > subDays(new Date(), 30)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ordered in last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, phone, city, or postal code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="high_value">High Value (£100+)</SelectItem>
                  <SelectItem value="frequent">Frequent (3+ orders)</SelectItem>
                  <SelectItem value="new">New (Last 30 days)</SelectItem>
                  <SelectItem value="no_orders">No Orders</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Join Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="total_spent">Total Spent</SelectItem>
                  <SelectItem value="total_orders">Orders</SelectItem>
                  <SelectItem value="last_order">Last Order</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>

              <DateRangePicker
                date={dateRange}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Joined {format(new Date(customer.created_at), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.city}</div>
                      {customer.postal_code && (
                        <div className="text-muted-foreground">{customer.postal_code}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.total_orders} total</div>
                      <div className="text-muted-foreground">
                        {customer.order_count} meals, {customer.package_order_count} packages
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(customer.total_spent)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      getCustomerValue(customer) === "high" ? "default" :
                      getCustomerValue(customer) === "medium" ? "secondary" : "outline"
                    }>
                      {getCustomerValue(customer) === "high" ? "High" :
                       getCustomerValue(customer) === "medium" ? "Medium" : "Low"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.last_order_date 
                        ? format(new Date(customer.last_order_date), "MMM dd, yyyy")
                        : "Never"
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            fetchCustomerOrders(customer.user_id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Customer Details</DialogTitle>
                          <DialogDescription>
                            Complete profile and order history for {selectedCustomer?.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedCustomer && (
                          <Tabs defaultValue="profile" className="w-full">
                            <TabsList>
                              <TabsTrigger value="profile">Profile</TabsTrigger>
                              <TabsTrigger value="orders">Orders ({customerOrders.length})</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="profile" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Contact Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-2" />
                                      <span>{selectedCustomer.full_name}</span>
                                    </div>
                                    {selectedCustomer.phone && (
                                      <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2" />
                                        <span>{selectedCustomer.phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-2" />
                                      <span>{selectedCustomer.delivery_address}</span>
                                    </div>
                                    <div className="ml-6">
                                      <span>{selectedCustomer.city}, {selectedCustomer.postal_code}</span>
                                    </div>
                                    {selectedCustomer.county && (
                                      <div className="ml-6">
                                        <span>{selectedCustomer.county}</span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Order Summary</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                      <span>Total Orders:</span>
                                      <span className="font-medium">{selectedCustomer.total_orders}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Meal Orders:</span>
                                      <span>{selectedCustomer.order_count}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Package Orders:</span>
                                      <span>{selectedCustomer.package_order_count}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total Spent:</span>
                                      <span className="font-medium">{formatCurrency(selectedCustomer.total_spent)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Customer Since:</span>
                                      <span>{format(new Date(selectedCustomer.created_at), "MMM dd, yyyy")}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="orders">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {customerOrders.map((order) => (
                                    <TableRow key={order.id}>
                                      <TableCell className="font-mono text-sm">
                                        {order.id.slice(0, 8)}...
                                      </TableCell>
                                      <TableCell>
                                        {format(new Date(order.created_at), "MMM dd, yyyy")}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">
                                          {order.type === 'order' ? 'Meal' : 'Package'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                                      <TableCell>
                                        <Badge variant={
                                          order.status === 'completed' ? 'default' :
                                          order.status === 'pending' ? 'secondary' : 'destructive'
                                        }>
                                          {order.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{order.items_count}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No customers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersManager;