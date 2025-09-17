import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutItem {
  name: string;
  amount?: number; // minor units (e.g., pence)
  price?: number;  // decimal price (e.g., 9.99)
  quantity: number;
  description?: string;
  meal_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const {
      items = [],
      currency = "gbp",
      delivery_fee,
      delivery_method,
      collection_point_id,
      successPath = "/payment-success",
      cancelPath = "/cart",
      email,
      requested_delivery_date,
      production_date,
    } = await req.json().catch(() => ({ items: [] }));

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const line_items = items.map((it: CheckoutItem) => {
      const unitAmount = typeof it.amount === "number" ? Math.round(it.amount) : Math.round((it.price ?? 0) * 100);
      if (!it.name || !unitAmount || unitAmount < 50) {
        throw new Error("Invalid item: name and amount/price are required; minimum 0.50");
      }
      return {
        price_data: {
          currency,
          product_data: { name: it.name, description: it.description },
          unit_amount: unitAmount,
        },
        quantity: it.quantity ?? 1,
      } as Stripe.Checkout.SessionCreateParams.LineItem;
    });

    if (typeof delivery_fee === "number" && delivery_fee > 0) {
      line_items.push({
        price_data: {
          currency,
          product_data: { name: "Delivery" },
          unit_amount: Math.round(delivery_fee),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://aicpnaomarzgborltdkt.supabase.co";

    // Format the delivery date for display
    const formattedDeliveryDate = requested_delivery_date 
      ? new Date(requested_delivery_date + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '';

    const deliveryInfo = delivery_method === 'pickup' 
      ? `🗓️🗓️🗓️ COLLECTION DATE 🗓️🗓️🗓️\n\n🔥 ${formattedDeliveryDate.toUpperCase()} 🔥`
      : `🚚🚚🚚 DELIVERY DATE 🚚🚚🚚\n\n🔥 ${formattedDeliveryDate.toUpperCase()} 🔥`;

    console.log('Debug delivery info:', {
      requested_delivery_date,
      delivery_method,
      formattedDeliveryDate,
      deliveryInfo
    });

    const session = await stripe.checkout.sessions.create({
      customer_email: email, // if undefined, Checkout collects email
      line_items,
      mode: "payment",
      submit_type: "pay",
      success_url: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      custom_text: requested_delivery_date ? {
        submit: {
          message: `\n\n███████████████████████████████\n${deliveryInfo}\n███████████████████████████████\n\n`
        }
      } : undefined,
      metadata: {
        delivery_method: delivery_method || '',
        collection_point_id: collection_point_id || '',
        requested_delivery_date: requested_delivery_date || '',
        production_date: production_date || '',
        items: JSON.stringify(items.map(item => ({
          meal_id: item.meal_id,
          name: item.name,
          quantity: item.quantity,
          amount: typeof item.amount === "number" ? item.amount : Math.round((item.price ?? 0) * 100)
        }))),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-payment] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});