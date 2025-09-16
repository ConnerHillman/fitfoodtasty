import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("Processing gift card redemption...");
    
    const { code, amount_to_use, order_id, user_id } = await req.json();

    if (!code || !amount_to_use || !order_id) {
      throw new Error("Gift card code, amount, and order ID are required");
    }

    console.log("Redeeming:", { code, amount_to_use, order_id, user_id });

    // First validate the gift card
    const { data: validation, error: validationError } = await supabaseClient
      .rpc('validate_gift_card', { 
        gift_card_code: code,
        amount_to_use: amount_to_use
      });

    if (validationError) {
      console.error("Validation error:", validationError);
      throw new Error("Failed to validate gift card");
    }

    if (!validation.valid) {
      throw new Error(validation.error || "Invalid gift card");
    }

    console.log("Validation successful:", validation);

    const giftCardId = validation.gift_card_id;
    const amountUsed = validation.amount_used;
    const newBalance = validation.new_balance;
    const fullyRedeemed = validation.fully_redeemed;

    // Start transaction to update gift card and create transaction record
    const { error: updateError } = await supabaseClient
      .from('gift_cards')
      .update({
        balance: newBalance,
        status: fullyRedeemed ? 'redeemed' : 'active',
        redeemed_at: fullyRedeemed ? new Date().toISOString() : null,
        redeemed_by_user_id: user_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', giftCardId);

    if (updateError) {
      console.error("Error updating gift card:", updateError);
      throw new Error("Failed to update gift card balance");
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('gift_card_transactions')
      .insert({
        gift_card_id: giftCardId,
        order_id: order_id,
        amount_used: amountUsed,
        remaining_balance: newBalance,
        transaction_type: fullyRedeemed ? 'redemption' : 'partial_use',
        user_id: user_id || null
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // This is not fatal, but log it
    }

    console.log("Gift card redemption successful");

    return new Response(JSON.stringify({ 
      success: true,
      amount_used: amountUsed,
      remaining_balance: newBalance,
      fully_redeemed: fullyRedeemed,
      gift_card_id: giftCardId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error redeeming gift card:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Failed to redeem gift card" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});