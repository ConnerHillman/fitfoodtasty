import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Calendar, DollarSign, Users, TrendingUp, RefreshCw } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const SubscriptionsManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // Fetch subscriptions with user and plan details
  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions', debouncedSearch, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            meal_count,
            price_per_delivery,
            delivery_frequency
          ),
          profiles!user_subscriptions_user_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (debouncedSearch) {
        // Note: This would need to be enhanced for proper search across user names
        query = query.or(`delivery_address.ilike.%${debouncedSearch}%,stripe_subscription_id.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch subscription statistics
  const { data: stats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data: allSubs, error } = await supabase
        .from('user_subscriptions')
        .select('status, subscription_plans(price_per_delivery)');

      if (error) throw error;
      if (!allSubs) return { total: 0, active: 0, paused: 0, cancelled: 0, pastDue: 0, monthlyRevenue: 0 };

      const active = allSubs.filter(s => s.status === 'active').length;
      const paused = allSubs.filter(s => s.status === 'paused').length;
      const cancelled = allSubs.filter(s => s.status === 'cancelled').length;
      const pastDue = allSubs.filter(s => s.status === 'past_due').length;
      
      const monthlyRevenue = allSubs
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
          const price = s.subscription_plans?.price_per_delivery || 0;
          return sum + price;
        }, 0);

      return {
        total: allSubs.length,
        active,
        paused,
        cancelled,
        pastDue,
        monthlyRevenue
      };
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "Paused" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      past_due: { variant: "outline", label: "Past Due" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscription Management</h2>
          <p className="text-muted-foreground">
            Manage customer subscriptions, billing, and delivery schedules
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.paused || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.pastDue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats?.monthlyRevenue?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="past_due">Past Due</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>
            All customer subscriptions and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Delivery</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((subscription: any) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {subscription.profiles?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.delivery_address || 'No address'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.subscription_plans?.name || 'Unknown Plan'}</div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.subscription_plans?.meal_count || 0} meals • {subscription.subscription_plans?.delivery_frequency || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(subscription.next_delivery_date)}
                    </TableCell>
                    <TableCell>
                      £{subscription.subscription_plans?.price_per_delivery?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      {formatDate(subscription.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {subscriptions && subscriptions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionsManager;