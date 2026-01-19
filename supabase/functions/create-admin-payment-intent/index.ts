import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ADMIN-PAYMENT-INTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Verify admin authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }
    logStep("Admin verified", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const {
      customer_email,
      customer_name,
      amount_in_pence,
      save_card = true,
      order_metadata = {},
    } = body;

    if (!customer_email || !amount_in_pence) {
      throw new Error("Missing required fields: customer_email, amount_in_pence");
    }

    logStep("Request data", { customer_email, amount_in_pence, save_card });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find or create Stripe customer
    let stripeCustomerId: string;
    const existingCustomers = await stripe.customers.list({
      email: customer_email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
      logStep("Found existing Stripe customer", { stripeCustomerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: customer_email,
        name: customer_name || undefined,
        metadata: {
          created_by: 'admin_order',
          admin_user_id: user.id,
        },
      });
      stripeCustomerId = newCustomer.id;
      logStep("Created new Stripe customer", { stripeCustomerId });
    }

    // Create Payment Intent with setup_future_usage if saving card
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amount_in_pence,
      currency: 'gbp',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        is_admin_order: 'true',
        admin_user_id: user.id,
        customer_email,
        customer_name: customer_name || '',
        ...order_metadata,
      },
    };

    // Only set setup_future_usage if saving card
    if (save_card) {
      paymentIntentParams.setup_future_usage = 'off_session';
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    logStep("Payment Intent created", { 
      paymentIntentId: paymentIntent.id, 
      save_card,
      setup_future_usage: save_card ? 'off_session' : 'not_set'
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
