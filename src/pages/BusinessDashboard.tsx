import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, Download, RefreshCw, Settings, ChefHat, Printer, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BusinessDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            meal_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .in("status", ["confirmed", "preparing", "ready", "out_for_delivery"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching orders:", error);
        return;
      }

      setOrders(ordersData || []);
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
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to create test orders', description: err.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const todayStats = {
    orders: orders.length,
    revenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
    customers: new Set(orders.map(order => order.customer_email)).size,
    avgOrder: orders.length > 0 ? orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) / orders.length : 0
  };
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
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.orders}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{todayStats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+8%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.customers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+5%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{todayStats.avgOrder.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+2%</span> from yesterday
            </p>
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