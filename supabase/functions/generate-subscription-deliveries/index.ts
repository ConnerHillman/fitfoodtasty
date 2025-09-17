import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-SUBSCRIPTION-DELIVERIES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { subscription_id } = await req.json();
    if (!subscription_id) throw new Error("Subscription ID is required");
    logStep("Request parsed", { subscription_id });

    // Get subscription details
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          delivery_frequency,
          meal_count
        )
      `)
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) throw new Error("Subscription not found");
    logStep("Subscription found", { subscriptionId: subscription.id });

    // Get existing deliveries to find the last scheduled date
    const { data: existingDeliveries, error: deliveriesError } = await supabaseClient
      .from('subscription_deliveries')
      .select('planned_delivery_date')
      .eq('user_subscription_id', subscription_id)
      .order('planned_delivery_date', { ascending: false })
      .limit(1);

    if (deliveriesError) throw new Error("Failed to fetch existing deliveries");

    // Calculate next delivery dates
    const frequency = subscription.subscription_plans.delivery_frequency;
    const lastDeliveryDate = existingDeliveries?.length > 0 
      ? new Date(existingDeliveries[0].planned_delivery_date)
      : new Date();

    const deliveriesToCreate = [];
    let nextDate = new Date(lastDeliveryDate);

    // Calculate interval based on frequency
    const intervalDays = frequency === 'weekly' ? 7 : frequency === 'bi-weekly' ? 14 : 30;

    // Generate next 6 deliveries
    for (let i = 0; i < 6; i++) {
      if (existingDeliveries?.length === 0 && i === 0) {
        // First delivery - schedule for next week if no existing deliveries
        nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setDate(nextDate.getDate() + intervalDays);
      }

      // Skip weekends - move to Monday if delivery falls on weekend
      const dayOfWeek = nextDate.getDay();
      if (dayOfWeek === 0) { // Sunday
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (dayOfWeek === 6) { // Saturday
        nextDate.setDate(nextDate.getDate() + 2);
      }

      deliveriesToCreate.push({
        user_subscription_id: subscription_id,
        planned_delivery_date: nextDate.toISOString().split('T')[0],
        status: 'scheduled',
        meal_selections: null
      });
    }

    logStep("Deliveries to create", { count: deliveriesToCreate.length });

    // Insert new deliveries
    const { data: newDeliveries, error: insertError } = await supabaseClient
      .from('subscription_deliveries')
      .insert(deliveriesToCreate)
      .select();

    if (insertError) throw new Error(`Failed to create deliveries: ${insertError.message}`);
    
    logStep("Deliveries created successfully", { count: newDeliveries?.length || 0 });

    return new Response(JSON.stringify({ 
      success: true, 
      deliveries_created: newDeliveries?.length || 0,
      deliveries: newDeliveries
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-subscription-deliveries", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});