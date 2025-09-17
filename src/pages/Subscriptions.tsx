import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Subscriptions = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch available subscription plans
  const { data: plans, isLoading } = useQuery({
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

  // Check current subscription status
  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
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

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { subscription_plan_id: planId }
      });

      if (error) throw error;

      if (data.url) {
        // Track that this is a subscription checkout
        sessionStorage.setItem('subscription_checkout', 'true');
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
    return currentSubscription?.subscription_plans?.stripe_product_id === plan.stripe_product_id;
  };

  const isPopular = (plan: any) => {
    return plan.name.toLowerCase().includes('standard');
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

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Meal Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fresh, delicious meals delivered to your door. Choose the plan that fits your lifestyle.
          </p>
        </div>

        {/* Current Subscription Alert */}
        {currentSubscription && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">
                    You're currently subscribed to: {currentSubscription.subscription_plans?.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Why Choose Our Meal Plans?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">Fresh, locally sourced ingredients prepared by professional chefs.</p>
            </div>
            <div>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Delivery</h3>
              <p className="text-muted-foreground">Choose your delivery schedule and pause anytime you need.</p>
            </div>
            <div>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Nutrition Focused</h3>
              <p className="text-muted-foreground">Balanced meals with detailed nutrition information for every dish.</p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Subscriptions;