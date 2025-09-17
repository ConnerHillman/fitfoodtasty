import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-SUBSCRIPTION-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err });
      return new Response(`Webhook signature verification failed`, { status: 400 });
    }

    logStep("Webhook event received", { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabaseClient, event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabaseClient, event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(supabaseClient, event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabaseClient, event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabaseClient, event.data.object as Stripe.Invoice);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-subscription-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(supabaseClient: any, session: Stripe.Checkout.Session) {
  logStep("Processing checkout completed", { sessionId: session.id });

  if (session.mode !== 'subscription') {
    logStep("Skipping non-subscription checkout");
    return;
  }

  const subscriptionPlanId = session.metadata?.subscription_plan_id;
  const userId = session.metadata?.user_id;

  if (!subscriptionPlanId || !userId) {
    logStep("Missing metadata in checkout session", { subscriptionPlanId, userId });
    return;
  }

  // Get subscription plan details
  const { data: plan, error: planError } = await supabaseClient
    .from('subscription_plans')
    .select('*')
    .eq('id', subscriptionPlanId)
    .single();

  if (planError || !plan) {
    logStep("Subscription plan not found", { planError });
    return;
  }

  // Calculate next delivery date
  const today = new Date();
  const daysToAdd = plan.delivery_frequency === 'weekly' ? 7 : 
                   plan.delivery_frequency === 'bi-weekly' ? 14 : 30;
  const nextDeliveryDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
    .toISOString().split('T')[0];

  // Create user subscription record
  const { error: insertError } = await supabaseClient
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      subscription_plan_id: subscriptionPlanId,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      status: 'active',
      next_delivery_date: nextDeliveryDate,
      meal_preferences: {}
    });

  if (insertError) {
    logStep("Error creating user subscription", { error: insertError });
  } else {
    logStep("User subscription created successfully");
  }
}

async function handleSubscriptionUpdate(supabaseClient: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription update", { subscriptionId: subscription.id, status: subscription.status });

  const { error: updateError } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    logStep("Error updating subscription", { error: updateError });
  } else {
    logStep("Subscription updated successfully");
  }
}

async function handleSubscriptionCancelled(supabaseClient: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription cancellation", { subscriptionId: subscription.id });

  const { error: cancelError } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (cancelError) {
    logStep("Error cancelling subscription", { error: cancelError });
  } else {
    logStep("Subscription cancelled successfully");
  }
}

async function handlePaymentSucceeded(supabaseClient: any, invoice: Stripe.Invoice) {
  logStep("Processing payment succeeded", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

  if (!invoice.subscription) return;

  // Update subscription status to active
  const { error: updateError } = await supabaseClient
    .from('user_subscriptions')
    .update({ status: 'active' })
    .eq('stripe_subscription_id', invoice.subscription);

  if (updateError) {
    logStep("Error updating subscription after payment", { error: updateError });
  } else {
    logStep("Subscription status updated after successful payment");
  }
}

async function handlePaymentFailed(supabaseClient: any, invoice: Stripe.Invoice) {
  logStep("Processing payment failed", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

  if (!invoice.subscription) return;

  // Update subscription status to past_due
  const { error: updateError } = await supabaseClient
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription);

  if (updateError) {
    logStep("Error updating subscription after failed payment", { error: updateError });
  } else {
    logStep("Subscription status updated after failed payment");
  }
}