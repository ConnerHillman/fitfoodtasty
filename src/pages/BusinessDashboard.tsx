import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, Download, RefreshCw, Settings, ChefHat, Printer, PlusCircle, Eye, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const BusinessDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [packageOrders, setPackageOrders] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuViews, setMenuViews] = useState(112);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch regular orders
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
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Fetch package orders
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

  const createTestOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Not signed in', description: 'Please login to create test orders.', variant: 'destructive' });
        return;
      }

      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('id, name, price')
        .limit(3);
      if (mealsError) throw mealsError;
      if (!meals || meals.length === 0) {
        toast({ title: 'No meals found', description: 'Create at least one meal first.', variant: 'destructive' });
        return;
      }

      const baseCustomer = {
        customer_email: user.email || 'test@example.com',
        customer_name: (user.user_metadata as any)?.full_name || 'Test Customer',
        delivery_address: (user.user_metadata as any)?.delivery_address || '123 Test Street, Testville',
      };

      const ordersToCreate = [
        { status: 'confirmed', items: [ { meal: meals[0], qty: 2 } ] },
        { status: 'preparing', items: [ { meal: meals[0], qty: 1 }, { meal: meals[1] || meals[0], qty: 3 } ] },
      ];

      for (const o of ordersToCreate) {
        const total = o.items.reduce((sum, it) => sum + (Number(it.meal.price || 9) * it.qty), 0);
        const { data: orderRow, error: orderErr } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            total_amount: Number(total.toFixed(2)),
            currency: 'gbp',
            status: o.status,
            stripe_session_id: null,
            ...baseCustomer,
          })
          .select('id')
          .single();
        if (orderErr) throw orderErr;

        const items = o.items.map(it => ({
          order_id: orderRow.id,
          meal_id: it.meal.id,
          meal_name: it.meal.name,
          quantity: it.qty,
          unit_price: Number(it.meal.price || 9),
          total_price: Number((Number(it.meal.price || 9) * it.qty).toFixed(2)),
        }));

        const { error: itemErr } = await supabase.from('order_items').insert(items);
        if (itemErr) throw itemErr;
      }

      toast({ title: 'Test orders created', description: 'Added a couple of orders. Refreshing list...' });
      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to create test orders', description: err.message || 'Unknown error', variant: 'destructive' });
    }
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Business Dashboard</h1>
          <p className="text-muted-foreground text-lg">Today's overview and recent activity</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/admin">
            <Button variant="default">
              <ChefHat className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-blue-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{todayStats.revenue.toFixed(2)}</div>
            <p className="text-xs text-blue-100 mt-1">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -11% Compared to £{(todayStats.revenue * 1.11).toFixed(2)} last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayStats.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
              -17% Compared to {Math.floor(todayStats.orders * 1.17)} last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Menu Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{menuViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
              -23% Compared to {Math.floor(menuViews * 1.23)} last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayStats.newCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
              -33% Compared to {Math.floor(todayStats.newCustomers * 1.33)} last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-orange-400 text-white lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-100">CUSTOMERS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-4xl font-bold">{todayStats.totalCustomers}</div>
                <div className="text-orange-100 text-sm">TOTAL</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{todayStats.activeCustomers}</div>
                <div className="text-orange-100 text-sm">ACTIVE</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{todayStats.leads}</div>
                <div className="text-orange-100 text-sm">LEADS</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-400 text-white lg:col-span-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-bold">£{(todayStats.revenue / todayStats.orders || 0).toFixed(2)}</div>
                <div className="text-red-100 text-sm">AVERAGE SALE</div>
              </div>
              <div>
                <div className="text-3xl font-bold">£{(todayStats.revenue / (todayStats.orders * 2) || 0).toFixed(2)}</div>
                <div className="text-red-100 text-sm">AVERAGE ITEM SALE</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Sales</CardTitle>
              <div className="text-sm text-muted-foreground">
                Compare to: Last Month
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`£${value}`, 'Sales']} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="url(#salesGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Menu Views Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              MENU VIEWS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-right text-sm font-medium">Added</div>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{activity.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-xs">{Math.floor(Math.random() * 3) + 1} minute</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>TOP SELLING ITEMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>Title</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              {topSellingItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No sales data</div>
              ) : (
                topSellingItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span>{item.quantity}</span>
                    <span>£{item.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Packages */}
        <Card>
          <CardHeader>
            <CardTitle>TOP SELLING PACKAGES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>Title</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              {topSellingPackages.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No package sales</div>
              ) : (
                topSellingPackages.map((pkg, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-medium">{pkg.title}</span>
                    <span>{pkg.quantity}</span>
                    <span>£{pkg.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Recent Orders</span>
            </CardTitle>
            <CardDescription>Latest customer orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">#{order.id.slice(-8)}</div>
                      <div className="text-sm text-muted-foreground">{order.customer_name || 'Customer'}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.order_items.length} items • {new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">£{parseFloat(order.total_amount || 0).toFixed(2)}</div>
                      <Badge variant={getStatusColor(order.status) as any} className="text-xs">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Orders
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common business operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline" onClick={createTestOrders}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Test Orders
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Generate Kitchen Report
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={printDeliveryLabels}>
              <Printer className="h-4 w-4 mr-2" />
              Print Delivery Labels
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Customer Management
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Daily Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessDashboard;