import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAUSE-RESUME-SUBSCRIPTION] ${step}${detailsStr}`);
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
    const { action, paused_until } = body; // action: 'pause' or 'resume'
    
    if (!action || !['pause', 'resume'].includes(action)) {
      throw new Error("Invalid action. Must be 'pause' or 'resume'");
    }

    logStep("Request body parsed", { action, pausedUntil: paused_until });

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      throw new Error("No active subscription found");
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

    // Get Stripe subscription
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

    let updateData: any = {};
    let stripeUpdate: any = {};

    if (action === 'pause') {
      // Pause subscription
      const pauseDate = paused_until ? new Date(paused_until) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
      
      updateData = {
        status: 'paused',
        paused_until: pauseDate.toISOString(),
      };

      // Update Stripe subscription to pause billing
      stripeUpdate = {
        pause_collection: {
          behavior: 'mark_uncollectible',
          resumes_at: Math.floor(pauseDate.getTime() / 1000),
        }
      };
    } else {
      // Resume subscription
      updateData = {
        status: 'active',
        paused_until: null,
      };

      stripeUpdate = {
        pause_collection: null, // This resumes the subscription
      };
    }

    // Update Stripe subscription
    const updatedStripeSubscription = await stripe.subscriptions.update(
      stripeSubscription.id,
      stripeUpdate
    );
    logStep("Updated Stripe subscription", { 
      subscriptionId: updatedStripeSubscription.id,
      status: updatedStripeSubscription.status,
      pauseCollection: updatedStripeSubscription.pause_collection
    });

    // Update local subscription record
    const { data: updatedSubscription, error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('status', action === 'pause' ? 'active' : 'paused')
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
      throw new Error(`Failed to ${action} subscription`);
    }

    logStep(`Subscription ${action}d successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      action,
      subscription: updatedSubscription
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in pause-resume-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});