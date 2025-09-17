import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, Pause, Play, CreditCard, Package, MapPin, Loader2, Check, Star, ChefHat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import SubscriptionMealSelectionDialog from "@/components/subscription/SubscriptionMealSelectionDialog";
import MealRotationManager from "@/components/subscription/MealRotationManager";

const MySubscription = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pauseResumeLoading, setPauseResumeLoading] = useState(false);
  const [scheduleModifyLoading, setScheduleModifyLoading] = useState(false);
  const [pauseDate, setPauseDate] = useState("");
  const [mealSelectionOpen, setMealSelectionOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
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
            description,
            stripe_product_id
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

  // Fetch available subscription plans for Browse Plans tab
  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_per_delivery', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch available meals for Meal Selection tab
  const { data: meals } = useQuery({
    queryKey: ['meals-for-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
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

  // Pause/Resume subscription
  const pauseResumeSubscription = useMutation({
    mutationFn: async ({ action, paused_until }: { action: 'pause' | 'resume', paused_until?: string }) => {
      const { data, error } = await supabase.functions.invoke('pause-resume-subscription', {
        body: { action, paused_until }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: `Subscription ${data.action === 'pause' ? 'Paused' : 'Resumed'}`,
        description: `Your subscription has been ${data.action === 'pause' ? 'paused' : 'resumed'} successfully.`,
      });
    },
    onError: (error) => {
      console.error('Pause/Resume error:', error);
      toast({
        title: "Operation Failed",
        description: "Failed to update subscription status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Modify delivery schedule
  const modifyDeliverySchedule = useMutation({
    mutationFn: async ({ new_plan_id, next_delivery_date }: { new_plan_id: string, next_delivery_date?: string }) => {
      const { data, error } = await supabase.functions.invoke('modify-delivery-schedule', {
        body: { new_plan_id, next_delivery_date }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: "Schedule Updated",
        description: "Your delivery schedule has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Schedule modification error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update delivery schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePauseResume = async (action: 'pause' | 'resume') => {
    setPauseResumeLoading(true);
    try {
      await pauseResumeSubscription.mutateAsync({ 
        action, 
        paused_until: action === 'pause' ? pauseDate : undefined 
      });
    } finally {
      setPauseResumeLoading(false);
      setPauseDate("");
    }
  };

  const handleScheduleChange = async (planId: string) => {
    setScheduleModifyLoading(true);
    try {
      await modifyDeliverySchedule.mutateAsync({ new_plan_id: planId });
    } finally {
      setScheduleModifyLoading(false);
    }
  };

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

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    // Find the selected plan
    const plan = plans?.find(p => p.id === planId);
    if (!plan) {
      toast({
        title: "Plan Not Found",
        description: "The selected plan could not be found.",
        variant: "destructive",
      });
      return;
    }

    // Open meal selection dialog first
    setSelectedPlan(plan);
    setMealSelectionOpen(true);
  };

  const handleProceedToCheckout = async (selectedMeals: Record<string, number>) => {
    if (!selectedPlan) return;
    
    setLoadingPlan(selectedPlan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { 
          subscription_plan_id: selectedPlan.id,
          selected_meals: selectedMeals
        }
      });

      if (error) throw error;

      if (data.url) {
        sessionStorage.setItem('subscription_checkout', 'true');
        sessionStorage.setItem('subscription_meals', JSON.stringify(selectedMeals));
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to start subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
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

  const getPlanFeatures = (plan: any) => {
    const features = [
      `${plan.meal_count} meals per delivery`,
      `${plan.delivery_frequency} delivery`,
      "Premium quality ingredients",
      "Nutrition information included",
      "Customizable meal preferences"
    ];

    if (plan.name.toLowerCase().includes('family')) {
      features.push("Family-size portions", "Kid-friendly options");
    }
    
    if (plan.name.toLowerCase().includes('standard') || plan.name.toLowerCase().includes('family')) {
      features.push("Priority customer support");
    }

    return features;
  };

  const isCurrentPlan = (plan: any) => {
    return subscription?.subscription_plans?.stripe_product_id === plan.stripe_product_id;
  };

  const isPopular = (plan: any) => {
    return plan.name.toLowerCase().includes('standard');
  };

  // Determine default tab based on subscription status
  const defaultTab = !subscription ? "browse-plans" : "current-plan";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="current-plan" disabled={!subscription}>
            <span className="hidden sm:inline">Current Plan</span>
            <span className="sm:hidden">Current</span>
          </TabsTrigger>
          <TabsTrigger value="browse-plans">
            <span className="hidden sm:inline">Browse Plans</span>
            <span className="sm:hidden">Browse</span>
          </TabsTrigger>
          <TabsTrigger value="meal-selection" disabled={!subscription}>
            <span className="hidden sm:inline">Meal Selection</span>
            <span className="sm:hidden">Meals</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current-plan" className="space-y-6 mt-4">{/* Current Plan Tab */}
          {!subscription ? (
            <Card className="text-center">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">No active subscription found. Browse our plans to get started!</p>
                <Button onClick={() => (document.querySelector('[value="browse-plans"]') as HTMLElement)?.click()}>
                  Browse Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
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

                    {/* Pause/Resume Controls */}
                    {subscription.status === 'active' ? (
                      <div className="space-y-2">
                        <Label htmlFor="pause-date" className="text-sm">Pause until (optional):</Label>
                        <Input
                          id="pause-date"
                          type="date"
                          value={pauseDate}
                          onChange={(e) => setPauseDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <Button 
                          variant="outline"
                          className="w-full" 
                          onClick={() => handlePauseResume('pause')}
                          disabled={pauseResumeLoading}
                        >
                          {pauseResumeLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Pausing...
                            </>
                          ) : (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Subscription
                            </>
                          )}
                        </Button>
                      </div>
                    ) : subscription.status === 'paused' ? (
                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => handlePauseResume('resume')}
                        disabled={pauseResumeLoading}
                      >
                        {pauseResumeLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Resuming...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Subscription
                          </>
                        )}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Delivery Schedule Modification */}
                {plans && plans.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Delivery Plan</CardTitle>
                      <CardDescription>Switch to a different meal plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plans
                        .filter(plan => plan.id !== subscription.subscription_plan_id)
                        .map((plan) => (
                          <Button
                            key={plan.id}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => handleScheduleChange(plan.id)}
                            disabled={scheduleModifyLoading}
                          >
                            <div className="text-left">
                              <div className="font-medium">{plan.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {plan.meal_count} meals • £{plan.price_per_delivery}
                              </div>
                            </div>
                            {scheduleModifyLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Calendar className="h-4 w-4" />
                            )}
                          </Button>
                        ))}
                    </CardContent>
                  </Card>
                )}

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

                    {subscription.paused_until && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paused Until:</span>
                        <span>{format(new Date(subscription.paused_until), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Browse Plans Tab */}
        <TabsContent value="browse-plans" className="space-y-6 mt-4">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Choose Your Meal Plan
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Fresh, delicious meals delivered to your door. Choose the plan that fits your lifestyle.
            </p>
          </div>

          {/* Current Subscription Alert */}
          {subscription && (
            <div className="mb-8">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium">
                      You're currently subscribed to: {subscription.subscription_plans?.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

              {/* Subscription Plans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {plans?.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${isPopular(plan) ? 'border-primary shadow-lg' : ''} ${isCurrentPlan(plan) ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPopular(plan) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan(plan) && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">£{plan.price_per_delivery}</span>
                    <span className="text-muted-foreground">/{plan.delivery_frequency}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {getPlanFeatures(plan).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan === plan.id || isCurrentPlan(plan)}
                    variant={isCurrentPlan(plan) ? "secondary" : "default"}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan(plan) ? (
                      "Current Plan"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

              {/* Features Section */}
              <div className="mt-12 sm:mt-16 text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Why Choose Our Meal Plans?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div>
                    <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Premium Quality</h4>
                <p className="text-muted-foreground">Fresh, locally sourced ingredients prepared by professional chefs.</p>
              </div>
              <div>
                    <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Flexible Delivery</h4>
                <p className="text-muted-foreground">Choose your delivery schedule and pause anytime you need.</p>
              </div>
              <div>
                <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Nutrition Focused</h4>
                <p className="text-muted-foreground">Balanced meals with detailed nutrition information for every dish.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="meal-selection" className="space-y-6 mt-4">{/* Meal Selection Tab */}
          {!subscription ? (
            <Card className="text-center">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">You need an active subscription to customize your meals.</p>
                <Button onClick={() => (document.querySelector('[value="browse-plans"]') as HTMLElement)?.click()}>
                  Browse Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Customize Your Meals</h2>
                <p className="text-muted-foreground">
                  Select {subscription.subscription_plans?.meal_count} meals for your next delivery
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Available Meals</CardTitle>
                  <CardDescription>
                    Choose from our fresh, chef-prepared meals
                  </CardDescription>
                </CardHeader>
                 <CardContent>
                   <MealRotationManager subscription={subscription} />
                 </CardContent>
               </Card>
             </div>
           )}
         </TabsContent>
       </Tabs>

       {/* Subscription Meal Selection Dialog */}
       <SubscriptionMealSelectionDialog
         open={mealSelectionOpen}
         onOpenChange={setMealSelectionOpen}
         plan={selectedPlan}
         onProceedToCheckout={handleProceedToCheckout}
       />
     </div>
   );
 };

export default MySubscription;