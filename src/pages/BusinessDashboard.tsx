import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, Download, RefreshCw, Settings, ChefHat } from 'lucide-react';

const BusinessDashboard = () => {
  const todayStats = {
    orders: 45,
    revenue: 892.50,
    customers: 38,
    avgOrder: 19.83
  };

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Smith', items: 3, total: 38.97, status: 'preparing', time: '2 min ago' },
    { id: 'ORD-002', customer: 'Sarah Johnson', items: 2, total: 27.98, status: 'ready', time: '5 min ago' },
    { id: 'ORD-003', customer: 'Mike Davis', items: 4, total: 51.96, status: 'delivered', time: '12 min ago' },
    { id: 'ORD-004', customer: 'Emily Brown', items: 1, total: 12.99, status: 'pending', time: '15 min ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'preparing': return 'default';
      case 'ready': return 'destructive';
      case 'delivered': return 'outline';
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
          <Button variant="outline" size="sm">
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
            <div className="text-2xl font-bold">${todayStats.revenue.toFixed(2)}</div>
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
            <div className="text-2xl font-bold">${todayStats.avgOrder.toFixed(2)}</div>
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
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">{order.id}</div>
                    <div className="text-sm text-muted-foreground">{order.customer}</div>
                    <div className="text-xs text-muted-foreground">{order.items} items • {order.time}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">${order.total.toFixed(2)}</div>
                    <Badge variant={getStatusColor(order.status) as any} className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
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
            <Button className="w-full justify-start" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Generate Kitchen Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
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