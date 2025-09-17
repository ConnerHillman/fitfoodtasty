import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SUBSCRIPTION-PREFERENCES] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { 
      delivery_address, 
      delivery_instructions, 
      meal_preferences, 
      next_delivery_date,
      paused_until 
    } = body;

    logStep("Request body parsed", { 
      hasDeliveryAddress: !!delivery_address,
      hasDeliveryInstructions: !!delivery_instructions,
      hasMealPreferences: !!meal_preferences,
      nextDeliveryDate: next_delivery_date,
      pausedUntil: paused_until
    });

    // Build update object with only provided fields
    const updateData: any = {};
    if (delivery_address !== undefined) updateData.delivery_address = delivery_address;
    if (delivery_instructions !== undefined) updateData.delivery_instructions = delivery_instructions;
    if (meal_preferences !== undefined) updateData.meal_preferences = meal_preferences;
    if (next_delivery_date !== undefined) updateData.next_delivery_date = next_delivery_date;
    if (paused_until !== undefined) updateData.paused_until = paused_until;

    // Update subscription preferences
    const { data: updatedSubscription, error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update(updateData)
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
      logStep("Error updating subscription preferences", { error: updateError });
      throw new Error("Failed to update subscription preferences");
    }

    logStep("Subscription preferences updated successfully");

    return new Response(JSON.stringify({ 
      success: true,
      subscription: updatedSubscription
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-subscription-preferences", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});