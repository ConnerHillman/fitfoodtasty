import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MODIFY-DELIVERY-SCHEDULE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { new_plan_id, next_delivery_date } = body;
    
    if (!new_plan_id) {
      throw new Error("New plan ID is required");
    }

    logStep("Request body parsed", { newPlanId: new_plan_id, nextDeliveryDate: next_delivery_date });

    // Get user's current subscription
    const { data: currentSubscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          stripe_price_id,
          delivery_frequency
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !currentSubscription) {
      throw new Error("No active subscription found");
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', new_plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !newPlan) {
      throw new Error("Invalid or inactive plan selected");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find customer in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get current Stripe subscription
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (stripeSubscriptions.data.length === 0) {
      throw new Error("No active Stripe subscription found");
    }

    const stripeSubscription = stripeSubscriptions.data[0];
    logStep("Found Stripe subscription", { subscriptionId: stripeSubscription.id });

    // Update the subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      stripeSubscription.id,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: newPlan.stripe_price_id,
        }],
        proration_behavior: 'create_prorations',
      }
    );
    logStep("Updated Stripe subscription", { 
      subscriptionId: updatedStripeSubscription.id,
      newPriceId: newPlan.stripe_price_id
    });

    // Calculate next delivery date if not provided
    let calculatedNextDelivery = next_delivery_date;
    if (!calculatedNextDelivery) {
      const today = new Date();
      const deliveryFrequency = newPlan.delivery_frequency.toLowerCase();
      
      if (deliveryFrequency.includes('weekly')) {
        calculatedNextDelivery = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (deliveryFrequency.includes('bi-weekly')) {
        calculatedNextDelivery = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else {
        calculatedNextDelivery = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Update local subscription record
    const { data: updatedSubscription, error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        subscription_plan_id: new_plan_id,
        next_delivery_date: calculatedNextDelivery,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .select(`
        *,
        subscription_plans (
          name,
          description,
          meal_count,
          delivery_frequency,
          price_per_delivery
        )
      `)
      .single();

    if (updateError) {
      logStep("Error updating subscription", { error: updateError });
      throw new Error("Failed to update delivery schedule");
    }

    logStep("Delivery schedule updated successfully");

    return new Response(JSON.stringify({ 
      success: true,
      subscription: updatedSubscription
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in modify-delivery-schedule", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});