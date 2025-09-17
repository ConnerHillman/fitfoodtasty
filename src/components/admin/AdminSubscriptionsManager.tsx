import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Repeat, Pause, Play, X, Settings, Eye, Calendar, User, CreditCard, RefreshCw } from "lucide-react";
import CustomerLink from "./CustomerLink";

interface AdminSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  next_delivery_date: string | null;
  delivery_method: string;
  delivery_address: string | null;
  delivery_instructions: string | null;
  created_at: string;
  cancelled_at: string | null;
  pause_reason: string | null;
  paused_until: string | null;
  cancellation_reason: string | null;
  profiles?: {
    full_name: string;
    phone: string;
  } | null;
}

const AdminSubscriptionsManager = () => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          profiles(full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions((data as any) || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (subscriptionId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      setActionLoading(subscriptionId);
      
      // Here you would typically call Stripe API to pause/resume/cancel
      // For now, we'll just update the local status
      const updates: any = { updated_at: new Date().toISOString() };
      
      switch (action) {
        case 'pause':
          updates.status = 'paused';
          updates.pause_reason = 'Admin paused';
          updates.paused_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
          break;
        case 'resume':
          updates.status = 'active';
          updates.pause_reason = null;
          updates.paused_until = null;
          break;
        case 'cancel':
          updates.status = 'cancelled';
          updates.cancelled_at = new Date().toISOString();
          updates.cancellation_reason = 'Admin cancelled';
          break;
      }

      const { error } = await supabase
        .from("user_subscriptions")
        .update(updates)
        .eq("id", subscriptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription ${action}d successfully`,
      });

      fetchSubscriptions();
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} subscription`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openCustomerPortal = async (customerId: string) => {
    try {
      // This would open Stripe customer portal - placeholder for now
      toast({
        title: "Feature Coming Soon",
        description: "Direct customer portal access will be available soon",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "incomplete":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSubscriptionStats = () => {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const paused = subscriptions.filter(s => s.status === 'paused').length;
    const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;

    return { total, active, paused, cancelled };
  };

  const stats = getSubscriptionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pause className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <Button onClick={fetchSubscriptions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
              <p className="text-muted-foreground">
                Subscriptions will appear here when customers start subscribing
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Next Delivery</TableHead>
                    <TableHead>Delivery Method</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <CustomerLink
                            customerId={subscription.user_id}
                            customerName={subscription.profiles?.full_name || 'Unknown'}
                            customerData={{
                              user_id: subscription.user_id,
                              full_name: subscription.profiles?.full_name || 'Unknown',
                              phone: subscription.profiles?.phone,
                              email: '',
                            }}
                            className="font-medium"
                          />
                          <p className="text-sm text-muted-foreground">
                            {subscription.profiles?.phone || 'No phone'}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {formatDate(subscription.created_at)}
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {subscription.next_delivery_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(subscription.next_delivery_date)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not scheduled</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {subscription.delivery_method === 'delivery' ? 'Delivery' : 'Collection'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subscription.status === 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading === subscription.id}
                                >
                                  <Pause className="h-3 w-3 mr-1" />
                                  Pause
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Pause Subscription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will pause the customer's subscription. They won't be charged and won't receive deliveries until resumed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSubscriptionAction(subscription.id, 'pause')}>
                                    Pause Subscription
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {subscription.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubscriptionAction(subscription.id, 'resume')}
                              disabled={actionLoading === subscription.id}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Resume
                            </Button>
                          )}
                          
                          {(subscription.status === 'active' || subscription.status === 'paused') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading === subscription.id}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently cancel the customer's subscription. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Cancel Subscription
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCustomerPortal(subscription.stripe_customer_id)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptionsManager;