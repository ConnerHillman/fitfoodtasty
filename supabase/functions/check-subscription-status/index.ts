import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION-STATUS] ${step}${detailsStr}`);
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing subscription in our database
    const { data: userSubscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
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
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      logStep("Database error checking subscription", { error: subError });
      throw new Error("Error checking subscription status");
    }

    if (!userSubscription) {
      logStep("No active subscription found in database");
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Subscription found in database", { subscriptionId: userSubscription.id });

    // Verify with Stripe if we have a Stripe subscription ID
    let stripeSubscription = null;
    if (userSubscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(userSubscription.stripe_subscription_id);
        logStep("Stripe subscription retrieved", { 
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
        });

        // Update our database if Stripe status differs
        if (stripeSubscription.status !== userSubscription.status) {
          const { error: updateError } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: stripeSubscription.status,
              current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', userSubscription.id);

          if (updateError) {
            logStep("Error updating subscription status", { error: updateError });
          } else {
            logStep("Subscription status updated in database");
          }
        }
      } catch (stripeError) {
        logStep("Error retrieving Stripe subscription", { error: stripeError });
        // Continue with database data if Stripe check fails
      }
    }

    // Calculate next delivery date if not set
    let nextDeliveryDate = userSubscription.next_delivery_date;
    if (!nextDeliveryDate && userSubscription.subscription_plans) {
      const plan = userSubscription.subscription_plans;
      const today = new Date();
      const daysToAdd = plan.delivery_frequency === 'weekly' ? 7 : 
                       plan.delivery_frequency === 'bi-weekly' ? 14 : 30;
      nextDeliveryDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      // Update database with calculated date
      await supabaseClient
        .from('user_subscriptions')
        .update({ next_delivery_date: nextDeliveryDate })
        .eq('id', userSubscription.id);
    }

    const responseData = {
      hasSubscription: true,
      subscription: {
        id: userSubscription.id,
        status: stripeSubscription?.status || userSubscription.status,
        plan: userSubscription.subscription_plans,
        nextDeliveryDate: nextDeliveryDate,
        currentPeriodEnd: stripeSubscription ? 
          new Date(stripeSubscription.current_period_end * 1000).toISOString() : 
          userSubscription.current_period_end,
        deliveryAddress: userSubscription.delivery_address,
        deliveryInstructions: userSubscription.delivery_instructions,
        mealPreferences: userSubscription.meal_preferences,
        pausedUntil: userSubscription.paused_until
      }
    };

    logStep("Returning subscription data", { hasSubscription: true });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});