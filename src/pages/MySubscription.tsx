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

  // Fetch available packages for Browse Plans tab
  const { data: packages } = useQuery({
    queryKey: ['packages-for-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
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

  const handleSubscribe = async (packageId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    // Find the selected package
    const pkg = packages?.find(p => p.id === packageId);
    if (!pkg) {
      toast({
        title: "Package Not Found",
        description: "The selected package could not be found.",
        variant: "destructive",
      });
      return;
    }

    // Open meal selection dialog first
    setSelectedPlan(pkg);
    setMealSelectionOpen(true);
  };

  const handleProceedToCheckout = async (selectedMeals: Record<string, number>) => {
    if (!selectedPlan) return;
    
    setLoadingPlan(selectedPlan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { 
          package_id: selectedPlan.id,
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

  const getFrequencyOptions = () => [
    { value: "weekly", label: "Weekly", discount: "5% off" },
    { value: "bi-weekly", label: "Bi-weekly", discount: "10% off" },
    { value: "monthly", label: "Monthly", discount: "15% off" }
  ];

  const isPopular = (pkg: any) => {
    // Mark packages with 6-12 meals as popular (standard family size)
    return pkg.meal_count >= 6 && pkg.meal_count <= 12;
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
                {packages && packages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Delivery Plan</CardTitle>
                      <CardDescription>Switch to a different meal plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {packages && packages.length > 0 ? (
                        packages.map((pkg) => (
                          <Button
                            key={pkg.id}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => toast({
                              title: "Feature Coming Soon",
                              description: "Package-based subscriptions are coming soon!",
                            })}
                            disabled={true}
                          >
                            <div className="text-left">
                              <div className="font-medium">{pkg.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {pkg.meal_count} meals • £{pkg.price}
                              </div>
                            </div>
                            <Calendar className="h-4 w-4" />
                          </Button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No packages available for subscription changes.
                        </p>
                      )}
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
              Choose Your Subscription
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn any package into a recurring subscription and save on every delivery.
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
                      You have an active subscription
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Package-based Subscription Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {packages?.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative transition-all hover:shadow-md ${isPopular(pkg) ? 'border-primary shadow-sm' : ''}`}
              >
                {isPopular(pkg) && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="text-center">
                    {pkg.image_url && (
                      <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={pkg.image_url} 
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pkg.meal_count} meals per delivery
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="text-center">
                    <span className="text-2xl font-bold">£{pkg.price}</span>
                    <span className="text-muted-foreground text-sm">/delivery</span>
                  </div>
                  
                  {pkg.description && (
                    <p className="text-xs text-muted-foreground text-center line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-center">Choose frequency:</p>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {getFrequencyOptions().map((freq) => (
                        <div key={freq.value} className="text-center p-1 bg-muted rounded">
                          <div className="font-medium">{freq.label}</div>
                          <div className="text-green-600">{freq.discount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full h-8 text-sm"
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={loadingPlan === pkg.id}
                  >
                    {loadingPlan === pkg.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="mt-12 sm:mt-16 text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Why Subscribe?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div>
                <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Automatic Savings</h4>
                <p className="text-muted-foreground">Save 5-15% on every delivery with your subscription.</p>
              </div>
              <div>
                <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Flexible Schedule</h4>
                <p className="text-muted-foreground">Choose weekly, bi-weekly, or monthly deliveries.</p>
              </div>
              <div>
                <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Easy Management</h4>
                <p className="text-muted-foreground">Pause, modify, or cancel anytime through your account.</p>
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