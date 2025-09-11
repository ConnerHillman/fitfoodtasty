import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutItem {
  name: string;
  amount?: number; // in minor units (e.g., pence)
  price?: number;  // decimal price (e.g., 9.99)
  quantity: number;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Supabase client using anon key (only for reading auth user when token provided)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { items = [], currency = "gbp", delivery_fee, successPath = "/payment-success", cancelPath = "/cart" } = await req.json().catch(() => ({ items: [] }));
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Try to get authenticated user (optional)
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined = undefined;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email ?? undefined;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Build line items; accept either amount in minor units or price in decimal
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

    // Optionally add delivery as a separate line item
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

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail, // if undefined, Checkout collects email
      line_items,
      mode: "payment",
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
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