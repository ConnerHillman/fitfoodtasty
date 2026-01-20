import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  name: string;
  amount?: number;
  price?: number;
  quantity: number;
  description?: string;
  meal_id?: string;
  type?: string;
  packageData?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const {
      items,
      currency = "gbp",
      delivery_fee = 0,
      delivery_method,
      collection_point_id,
      requested_delivery_date,
      customer_email,
      customer_name,
      order_notes,
      coupon_code,
      coupon_data,
      gift_card_code,
      gift_card_amount_used,
      gift_card_id
    } = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create line items with 10% subscription discount
    const lineItems = items.map((item: CartItem) => {
      const unitAmount = Math.round(((item.amount || item.price || 0) * 0.9)); // 10% discount
      return {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: {
            name: item.name,
            description: item.description || "",
            metadata: {
              meal_id: item.meal_id || "",
              type: item.type || "meal",
            }
          },
          recurring: {
            interval: "week"
          }
        },
        quantity: item.quantity,
      };
    });

    // Add delivery fee as recurring item if applicable
    if (delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(delivery_fee * 0.9), // 10% discount on delivery too
          product_data: {
            name: delivery_method === "pickup" ? "Collection Fee" : "Delivery Fee",
            description: `Weekly ${delivery_method === "pickup" ? "collection" : "delivery"} service`,
          },
          recurring: {
            interval: "week"
          }
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&subscription=true`,
      cancel_url: `${origin}/cart`,
      metadata: {
        delivery_method: delivery_method || "",
        collection_point_id: collection_point_id || "",
        requested_delivery_date: requested_delivery_date || "",
        customer_email: customer_email || "",
        customer_name: customer_name || "",
        order_notes: order_notes || "",
        coupon_code: coupon_code || "",
        gift_card_code: gift_card_code || "",
        gift_card_amount_used: gift_card_amount_used?.toString() || "0",
        gift_card_id: gift_card_id || "",
        is_subscription: "true",
        subscription_items: JSON.stringify(items), // Store items for webhook processing
        delivery_address: customer_email === user.email ? "" : "" // TODO: Get from user profile
      },
      subscription_data: {
        metadata: {
          delivery_method: delivery_method || "",
          customer_name: customer_name || "",
          delivery_notes: order_notes || "",
          subscription_items: JSON.stringify(items) // Also store in subscription metadata
        }
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-subscription-checkout:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});