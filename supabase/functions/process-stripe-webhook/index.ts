import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key and webhook secret
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the signature from headers
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("No Stripe signature found");

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("Received webhook event:", event.type);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient);
        break;
      
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabaseClient);
        break;
      
      case "payment_intent.payment_failed":
        console.log("Payment failed:", event.data.object.id);
        break;
      
      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[process-stripe-webhook] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabaseClient: any) {
  console.log("Processing checkout session completed:", session.id);
  
  // Check if this is a gift card purchase
  const metadata = session.metadata;
  if (metadata?.type === "gift_card") {
    await processGiftCardPurchase(session, supabaseClient);
  } else {
    // Regular order processing (if needed)
    console.log("Regular order checkout session completed:", session.id);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  console.log("Processing payment intent succeeded:", paymentIntent.id);
  
  // Check if this is a gift card payment
  const metadata = paymentIntent.metadata;
  if (metadata?.type === "gift_card") {
    // Create the gift card in database
    await createGiftCardFromPayment(paymentIntent, supabaseClient);
  }
}

async function processGiftCardPurchase(session: Stripe.Checkout.Session, supabaseClient: any) {
  try {
    console.log("Processing gift card purchase for session:", session.id);
    
    const metadata = session.metadata;
    if (!metadata) {
      throw new Error("No metadata found in session");
    }

    // Generate unique gift card code
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc('generate_gift_card_code');
    
    if (codeError) throw codeError;
    const giftCardCode = codeData;

    // Calculate amount (convert from cents)
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    // Create gift card record
    const { data: giftCardData, error: giftCardError } = await supabaseClient
      .from('gift_cards')
      .insert({
        code: giftCardCode,
        amount: amount,
        balance: amount,
        purchaser_name: metadata.purchaser_name,
        purchaser_email: metadata.purchaser_email,
        recipient_name: metadata.recipient_name || null,
        recipient_email: metadata.recipient_email || null,
        message: metadata.message || null,
        purchaser_user_id: metadata.purchaser_user_id || null,
        stripe_payment_intent_id: session.payment_intent,
        status: 'active'
      })
      .select()
      .single();

    if (giftCardError) throw giftCardError;

    // Log initial transaction
    const { error: transactionError } = await supabaseClient
      .from('gift_card_transactions')
      .insert({
        gift_card_id: giftCardData.id,
        transaction_type: 'purchase',
        amount_used: 0,
        remaining_balance: amount,
        user_id: metadata.purchaser_user_id || null
      });

    if (transactionError) throw transactionError;

    console.log("Gift card created successfully:", giftCardData.code);

    // TODO: Send email notification to recipient and purchaser
    // This would require setting up email service (like Resend)
    
  } catch (error) {
    console.error("Error processing gift card purchase:", error);
    throw error;
  }
}

async function createGiftCardFromPayment(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  try {
    console.log("Creating gift card from payment intent:", paymentIntent.id);
    
    // Check if gift card already exists
    const { data: existingCard } = await supabaseClient
      .from('gift_cards')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (existingCard) {
      console.log("Gift card already exists for payment intent:", paymentIntent.id);
      return;
    }

    const metadata = paymentIntent.metadata;
    if (!metadata) {
      throw new Error("No metadata found in payment intent");
    }

    // Generate unique gift card code
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc('generate_gift_card_code');
    
    if (codeError) throw codeError;
    const giftCardCode = codeData;

    // Calculate amount (convert from cents)
    const amount = paymentIntent.amount / 100;

    // Create gift card record
    const { data: giftCardData, error: giftCardError } = await supabaseClient
      .from('gift_cards')
      .insert({
        code: giftCardCode,
        amount: amount,
        balance: amount,
        purchaser_name: metadata.purchaser_name,
        purchaser_email: metadata.purchaser_email,
        recipient_name: metadata.recipient_name || null,
        recipient_email: metadata.recipient_email || null,
        message: metadata.message || null,
        purchaser_user_id: metadata.purchaser_user_id || null,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'active'
      })
      .select()
      .single();

    if (giftCardError) throw giftCardError;

    // Log initial transaction
    const { error: transactionError } = await supabaseClient
      .from('gift_card_transactions')
      .insert({
        gift_card_id: giftCardData.id,
        transaction_type: 'purchase',
        amount_used: 0,
        remaining_balance: amount,
        user_id: metadata.purchaser_user_id || null
      });

    if (transactionError) throw transactionError;

    console.log("Gift card created successfully:", giftCardData.code);
    
  } catch (error) {
    console.error("Error creating gift card from payment:", error);
    throw error;
  }
}