import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Settings, Pause, Play, CreditCard, Package, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const MySubscription = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['my-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            meal_count,
            price_per_delivery,
            delivery_frequency,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update subscription preferences
  const updateSubscription = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase.functions.invoke('update-subscription-preferences', {
        body: updates
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription preferences have been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleManageSubscription = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { return_url: window.location.href }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Manage subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don't have an active subscription. Browse our meal plans to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/subscriptions">Browse Meal Plans</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Subscription</h1>
        <p className="text-muted-foreground">Manage your meal plan and delivery preferences</p>
      </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Subscription Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {subscription.subscription_plans?.name}
                    </CardTitle>
                    <CardDescription>
                      {subscription.subscription_plans?.description}
                    </CardDescription>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Meals per Delivery</Label>
                    <p className="text-2xl font-bold">{subscription.subscription_plans?.meal_count}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price per Delivery</Label>
                    <p className="text-2xl font-bold">£{subscription.subscription_plans?.price_per_delivery}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Delivery Frequency</Label>
                  <p className="text-lg">{subscription.subscription_plans?.delivery_frequency}</p>
                </div>

                {subscription.next_delivery_date && (
                  <div>
                    <Label className="text-sm font-medium">Next Delivery</Label>
                    <p className="text-lg">{format(new Date(subscription.next_delivery_date), 'MMM dd, yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    updateSubscription.mutate({
                      delivery_address: formData.get('delivery_address'),
                      delivery_instructions: formData.get('delivery_instructions'),
                      meal_preferences: formData.get('meal_preferences'),
                    });
                  }}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="delivery_address">Delivery Address</Label>
                        <Input
                          id="delivery_address"
                          name="delivery_address"
                          defaultValue={subscription.delivery_address?.toString() || ''}
                          placeholder="Enter your delivery address"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                        <Textarea
                          id="delivery_instructions"
                          name="delivery_instructions"
                          defaultValue={subscription.delivery_instructions?.toString() || ''}
                          placeholder="Special instructions for delivery (optional)"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="meal_preferences">Meal Preferences</Label>
                        <Textarea
                          id="meal_preferences"
                          name="meal_preferences"
                          defaultValue={subscription.meal_preferences?.toString() || ''}
                          placeholder="Dietary restrictions, allergies, or preferences"
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={updateSubscription.isPending}
                      >
                        {updateSubscription.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Delivery Address</Label>
                      <p className="text-sm text-muted-foreground">
                        {subscription.delivery_address?.toString() || 'No address specified'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Delivery Instructions</Label>
                      <p className="text-sm text-muted-foreground">
                        {subscription.delivery_instructions?.toString() || 'No special instructions'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Meal Preferences</Label>
                      <p className="text-sm text-muted-foreground">
                        {subscription.meal_preferences?.toString() || 'No preferences specified'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleManageSubscription}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Billing
                    </>
                  )}
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <a href="/subscriptions">
                    <Package className="h-4 w-4 mr-2" />
                    Change Plan
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{getStatusBadge(subscription.status)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{format(new Date(subscription.created_at), 'MMM dd, yyyy')}</span>
                </div>
                
                {subscription.current_period_start && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Period:</span>
                    <span>{format(new Date(subscription.current_period_start), 'MMM dd')}</span>
                  </div>
                )}
                
                {subscription.current_period_end && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Billing:</span>
                    <span>{format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default MySubscription;