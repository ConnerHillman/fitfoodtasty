import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authentication token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Get payment intent ID from request
    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) throw new Error("Payment intent ID is required");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment has not succeeded");
    }

    // Extract metadata
    const metadata = paymentIntent.metadata;
    const items = JSON.parse(metadata.items || "[]");
    const discountPercentage = parseFloat(metadata.discount_percentage || "0");
    
    // Calculate amounts
    const originalAmount = paymentIntent.amount; // in cents
    const discountAmount = discountPercentage > 0 ? Math.round((originalAmount * discountPercentage) / 100) : 0;
    const finalAmount = originalAmount; // Stripe already processed the discounted amount

    // Create order record
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: finalAmount / 100, // Convert back to dollars
        discount_amount: discountAmount / 100,
        currency: paymentIntent.currency,
        status: 'confirmed',
        customer_email: metadata.customer_email || user.email,
        customer_name: metadata.customer_name,
        requested_delivery_date: metadata.requested_delivery_date,
        production_date: metadata.production_date,
        delivery_address: user.user_metadata?.delivery_address,
        referral_code_used: metadata.coupon_code || null,
        stripe_session_id: payment_intent_id,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      meal_id: item.meal_id,
      meal_name: item.name,
      quantity: item.quantity,
      unit_price: item.amount / 100, // Convert from cents
      total_price: (item.amount * item.quantity) / 100,
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log('Order created successfully:', orderData.id);

    return new Response(JSON.stringify({ 
      success: true, 
      order_id: orderData.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-order-from-payment] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});