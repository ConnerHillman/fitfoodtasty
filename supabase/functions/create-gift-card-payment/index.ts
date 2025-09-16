import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftCardPurchaseRequest {
  amount: number;
  product_id?: string;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name?: string;
  recipient_email?: string;
  message?: string;
  is_gift: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("Starting gift card payment creation...");
    
    // Get authenticated user (optional for gift cards)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const {
      amount,
      product_id,
      purchaser_name,
      purchaser_email,
      recipient_name,
      recipient_email,
      message,
      is_gift = false
    }: GiftCardPurchaseRequest = await req.json();

    console.log("Request data:", { amount, is_gift, purchaser_email, recipient_email });

    // Validation
    if (!amount || amount < 10 || amount > 500) {
      throw new Error("Gift card amount must be between £10 and £500");
    }

    if (!purchaser_name || !purchaser_email) {
      throw new Error("Purchaser name and email are required");
    }

    if (is_gift && (!recipient_name || !recipient_email)) {
      throw new Error("Recipient name and email are required for gift cards");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer for purchaser
    let customerId;
    const customers = await stripe.customers.list({ 
      email: purchaser_email, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: purchaser_email,
        name: purchaser_name,
      });
      customerId = customer.id;
    }

    console.log("Stripe customer:", customerId);

    // Get gift card product if specified, or use custom amount
    let priceId = null;
    if (product_id) {
      const { data: product, error } = await supabaseClient
        .from('gift_card_products')
        .select('stripe_price_id, amount')
        .eq('id', product_id)
        .eq('is_active', true)
        .single();

      if (error || !product) {
        throw new Error("Invalid gift card product");
      }

      if (product.amount !== amount) {
        throw new Error("Amount does not match selected product");
      }

      priceId = product.stripe_price_id;
    }

    console.log("Using price ID:", priceId);

    // Create Stripe checkout session
    const sessionData: any = {
      customer: customerId,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/gift-card-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/gift-cards`,
      metadata: {
        type: 'gift_card',
        purchaser_user_id: user?.id || '',
        purchaser_name,
        purchaser_email,
        recipient_name: recipient_name || '',
        recipient_email: recipient_email || '',
        message: message || '',
        is_gift: is_gift.toString(),
        amount: amount.toString()
      },
      payment_intent_data: {
        metadata: {
          type: 'gift_card',
          purchaser_user_id: user?.id || '',
          amount: amount.toString()
        }
      }
    };

    if (priceId) {
      // Use existing Stripe product
      sessionData.line_items = [{
        price: priceId,
        quantity: 1,
      }];
    } else {
      // Create custom amount product
      sessionData.line_items = [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `£${amount} Gift Card`,
            description: 'Gift card for meal prep services',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }

    console.log("Creating Stripe session...");
    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("Session created:", session.id);

    return new Response(JSON.stringify({ 
      session_id: session.id,
      url: session.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error creating gift card payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to create gift card payment" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});