import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Repeat, Calendar, Settings, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  delivery_frequency?: string;
  next_delivery_date: string | null;
  delivery_notes?: string | null;
  delivery_method?: string;
}

const Subscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
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

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Sign in to view subscriptions</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your meal subscriptions
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage your weekly meal subscriptions and delivery preferences
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Repeat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
            <p className="text-muted-foreground mb-6">
              Start a weekly subscription to get your favorite meals delivered automatically
            </p>
            <Button asChild>
              <Link to="/menu">Browse Menu</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-primary" />
                    Weekly Meal Subscription
                  </CardTitle>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Billing Period:</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Next Delivery:</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {subscription.next_delivery_date ? formatDate(subscription.next_delivery_date) : "Not scheduled"}
                    </p>
                  </div>
                </div>

                {subscription.delivery_notes && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Delivery Notes:</span>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {subscription.delivery_notes}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={openCustomerPortal} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Manage Subscription
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <Link to="/menu">Change Meals</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;