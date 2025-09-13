import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, Download, RefreshCw, Settings, ChefHat, Printer, PlusCircle, Eye, TrendingDown, Activity, FileText, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { addDays, subDays, startOfDay, endOfDay } from "date-fns";
import CustomerLink from "@/components/admin/CustomerLink";
import OrderLink from "@/components/admin/OrderLink";

const BusinessDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [packageOrders, setPackageOrders] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuViews, setMenuViews] = useState(0);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const from = startOfDay(dateRange.from);
      const to = endOfDay(dateRange.to);

      // Fetch regular orders within date range
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            meal_name,
            quantity,
            unit_price,
            total_price,
            meal_id
          )
        `)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Fetch package orders within date range
      const { data: packageOrdersData, error: packageOrdersError } = await supabase
        .from("package_orders")
        .select(`
          *,
          package_meal_selections (
            id,
            quantity,
            meal_id
          )
        `)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false });

      if (packageOrdersError) {
        console.error("Error fetching package orders:", packageOrdersError);
      } else {
        setPackageOrders(packageOrdersData || []);
      }

      // Fetch meals for top selling analysis
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("is_active", true);

      if (mealsError) {
        console.error("Error fetching meals:", mealsError);
      } else {
        setMeals(mealsData || []);
      }

      // Fetch packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true);

      if (packagesError) {
        console.error("Error fetching packages:", packagesError);
      } else {
        setPackages(packagesData || []);
      }

      // Fetch menu views within date range
      const { data: viewsData, error: viewsError } = await supabase
        .from("page_views")
        .select("id")
        .eq("page_type", "menu")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      if (viewsError) {
        console.error("Error fetching views:", viewsError);
      } else {
        setMenuViews(viewsData?.length || 0);
      }

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const printDeliveryLabels = () => {
    if (orders.length === 0) {
      toast({
        title: "No Orders",
        description: "There are no confirmed orders to print labels for.",
        variant: "destructive",
      });
      return;
    }

    const readyOrders = orders.filter(order => 
      ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
    );

    if (readyOrders.length === 0) {
      toast({
        title: "No Orders Ready",
        description: "There are no orders ready for delivery labels.",
        variant: "destructive",
      });
      return;
    }

    // Create print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Print Blocked",
        description: "Please allow popups to print delivery labels.",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Labels</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
          }
          .label { 
            border: 2px solid #000; 
            margin-bottom: 20px; 
            padding: 15px; 
            page-break-after: always;
            width: 100%;
            box-sizing: border-box;
          }
          .label:last-child {
            page-break-after: avoid;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
          }
          .order-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px;
          }
          .order-number {
            font-size: 18px;
            font-weight: bold;
          }
          .customer-info {
            margin-bottom: 15px;
          }
          .customer-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .address {
            line-height: 1.4;
          }
          .items-section {
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          .items-title {
            font-weight: bold;
            margin-bottom: 8px;
          }
          .item {
            margin-bottom: 3px;
            font-size: 14px;
          }
          .status-badge {
            background: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .label { 
              page-break-after: always;
              margin: 0;
              border: 2px solid #000;
            }
          }
        </style>
      </head>
      <body>
        ${readyOrders.map(order => `
          <div class="label">
            <div class="header">
              <div class="company-name">Fit Food Tasty</div>
              <div>Delivery Label</div>
            </div>
            
            <div class="order-info">
              <div>
                <div class="order-number">Order #${order.id.slice(-8)}</div>
                <div class="status-badge">${order.status.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div style="text-align: right;">
                <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-GB')}</div>
                <div><strong>Time:</strong> ${new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            <div class="customer-info">
              <div class="customer-name">${order.customer_name || 'Customer'}</div>
              <div class="address">
                ${order.delivery_address || 'No delivery address provided'}
              </div>
              ${order.customer_email ? `<div style="margin-top: 5px;"><strong>Email:</strong> ${order.customer_email}</div>` : ''}
            </div>

            <div class="items-section">
              <div class="items-title">Order Items (${order.order_items.length} item${order.order_items.length !== 1 ? 's' : ''}):</div>
              ${order.order_items.map(item => `
                <div class="item">${item.quantity}x ${item.meal_name}</div>
              `).join('')}
            </div>
            
            <div style="margin-top: 15px; text-align: right;">
              <strong>Total: £${order.total_amount.toFixed(2)}</strong>
            </div>
          </div>
        `).join('')}
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    toast({
      title: "Printing Labels",
      description: `Generated ${readyOrders.length} delivery labels for printing.`,
    });
  };

  // Calculate comprehensive stats
  const allOrders = [...orders, ...packageOrders];
  const today = new Date().toDateString();
  const todayOrders = allOrders.filter(order => new Date(order.created_at).toDateString() === today);
  
  // Calculate new customers (customers with their first order today)
  const allCustomers = new Set(allOrders.map(order => order.customer_email || order.user_id));
  const newCustomersToday = todayOrders.filter(order => {
    const customerKey = order.customer_email || order.user_id;
    const customerOrders = allOrders.filter(o => (o.customer_email || o.user_id) === customerKey);
    // Check if this is their first order
    return customerOrders.length === 1 && new Date(customerOrders[0].created_at).toDateString() === today;
  });

  const todayStats = {
    orders: todayOrders.length,
    revenue: todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
    customers: new Set(todayOrders.map(order => order.customer_email || order.user_id)).size,
    avgOrder: todayOrders.length > 0 ? todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) / todayOrders.length : 0,
    newCustomers: newCustomersToday.length,
    totalCustomers: allCustomers.size,
    activeCustomers: Math.floor(allCustomers.size * 0.6),
    leads: Math.floor(Math.random() * 50) + 200 // Simulated for demo
  };

  // Generate sales chart data (last 7 days)
  const salesChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = allOrders.filter(order => 
      new Date(order.created_at).toDateString() === date.toDateString()
    );
    const revenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    
    return {
      date: date.getDate().toString().padStart(2, '0'),
      sales: revenue,
      orders: dayOrders.length
    };
  });

  // Calculate top selling items
  const mealSales = new Map();
  orders.forEach(order => {
    order.order_items?.forEach(item => {
      const current = mealSales.get(item.meal_name) || { quantity: 0, total: 0 };
      mealSales.set(item.meal_name, {
        quantity: current.quantity + item.quantity,
        total: current.total + parseFloat(item.total_price || 0)
      });
    });
  });

  const topSellingItems = Array.from(mealSales.entries())
    .map(([name, data]) => ({ title: name, quantity: data.quantity, total: data.total }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Calculate top selling packages
  const packageSales = new Map();
  packageOrders.forEach(order => {
    const packageData = packages.find(p => p.id === order.package_id);
    if (packageData) {
      const current = packageSales.get(packageData.name) || { quantity: 0, total: 0 };
      packageSales.set(packageData.name, {
        quantity: current.quantity + 1,
        total: current.total + parseFloat(order.total_amount || 0)
      });
    }
  });

  const topSellingPackages = Array.from(packageSales.entries())
    .map(([name, data]) => ({ title: name, quantity: data.quantity, total: data.total }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Recent activity data
  const recentActivity = allOrders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(order => ({
      id: order.id,
      name: order.customer_name || `Customer ${order.id.slice(-4)}`,
      action: order.package_id ? 'Package Order' : 'Meal Order',
      time: new Date(order.created_at),
      status: order.status
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'preparing': return 'default';
      case 'ready': return 'destructive';
      case 'out_for_delivery': return 'outline';
      case 'delivered': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business Dashboard</h2>
              <p className="text-muted-foreground">Real-time insights and performance analytics</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60"></div>
                  {todayStats.orders} orders today
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  £{todayStats.revenue.toFixed(2)} revenue
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <DateRangePicker
                date={dateRange}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="lg"
                disabled={loading}
                className={`bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-300 ${
                  loading ? 'animate-pulse scale-105 shadow-lg shadow-primary/20' : ''
                }`}
              >
                <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-300 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button
                onClick={printDeliveryLabels}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-blue-50/30 animate-scale-in">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-blue-500/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <DollarSign className="h-4 w-4" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">£{todayStats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              Average order: £{todayStats.avgOrder.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-green-50/30 animate-scale-in">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-b border-green-500/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <Package className="h-4 w-4" />
              Orders Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">{todayStats.orders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <Activity className="inline h-3 w-3 mr-1 text-blue-500" />
              {todayStats.customers} customers served
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-purple-50/30 animate-scale-in">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-b border-purple-500/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-purple-700">
              <Users className="h-4 w-4" />
              Customer Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-purple-600">{todayStats.newCustomers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <Target className="inline h-3 w-3 mr-1 text-purple-500" />
              {todayStats.totalCustomers} total customers
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-orange-50/30 animate-scale-in">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-b border-orange-500/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700">
              <Eye className="h-4 w-4" />
              Menu Views
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-orange-600">{menuViews}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <Calendar className="inline h-3 w-3 mr-1 text-orange-500" />
              Today's page views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Sales Performance
            </CardTitle>
            <CardDescription>Last 7 days revenue trend</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value) => [`£${value}`, 'Sales']} 
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#salesGradient)" 
                  strokeWidth={3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <div className="font-medium text-sm">{activity.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.action}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold text-muted-foreground border-b pb-2">
                <span>Item</span>
                <span>Qty</span>
                <span>Revenue</span>
              </div>
              {topSellingItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                </div>
              ) : (
                topSellingItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-muted/50 last:border-0">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-primary font-semibold">{item.quantity}</span>
                    <span className="font-semibold">£{item.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Packages */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top Selling Packages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold text-muted-foreground border-b pb-2">
                <span>Package</span>
                <span>Qty</span>
                <span>Revenue</span>
              </div>
              {topSellingPackages.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No package sales data</p>
                </div>
              ) : (
                topSellingPackages.map((pkg, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-muted/50 last:border-0">
                    <span className="font-medium">{pkg.title}</span>
                    <span className="text-primary font-semibold">{pkg.quantity}</span>
                    <span className="font-semibold">£{pkg.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Recent Orders
          </CardTitle>
          <CardDescription>Latest customer orders and their status</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Loading orders...</p>
              </div>
            ) : [...orders, ...packageOrders].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No orders found</p>
              </div>
            ) : (
              // Combine and sort all orders
              [...orders.map(o => ({...o, type: 'individual'})), ...packageOrders.map(o => ({...o, type: 'package'}))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 8)
                .map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-lg border border-muted/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        <CustomerLink 
                          customerId={order.user_id}
                          customerName={order.customer_name || 'Customer'}
                          variant="ghost"
                          size="sm"
                          className="text-lg font-bold"
                        />
                        {order.type === 'package' && <Badge variant="outline" className="ml-2 text-xs">Package</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <OrderLink orderId={order.id} className="text-muted-foreground hover:text-foreground">
                          #{order.id.slice(-8)}
                        </OrderLink>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.type === 'package' 
                          ? `${order.package_meal_selections?.length || 0} selections`
                          : `${order.order_items?.length || 0} items`
                        } • {new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">£{order.total_amount.toFixed(2)}</div>
                    <Badge variant={getStatusColor(order.status)} className="mt-1">
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDashboard;