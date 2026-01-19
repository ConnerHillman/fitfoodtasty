import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get display name safely (handles OAuth users with missing names)
function getDisplayName(
  metadata: Record<string, any> | undefined,
  fallback: string = ''
): string {
  if (!metadata) return fallback;
  
  const firstName = (metadata.first_name || metadata.given_name || '')?.trim();
  const lastName = (metadata.last_name || metadata.family_name || '')?.trim();
  
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  
  if (metadata.full_name?.trim()) {
    return metadata.full_name.trim();
  }
  
  if (metadata.name?.trim()) {
    return metadata.name.trim();
  }
  
  return fallback;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      event = JSON.parse(body);
    }

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.subscription) {
          console.log("Processing subscription checkout completion");
          
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customer = await stripe.customers.retrieve(session.customer as string);
          
          if (typeof customer === "string") {
            throw new Error("Customer object is a string, expected full object");
          }

          // Find user by email
          const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
          if (userError) throw userError;
          
          const user = userData.users.find(u => u.email === customer.email);
          if (!user) {
            console.error("User not found for email:", customer.email);
            break;
          }

          // Create user subscription record with subscription items
          const { error: subscriptionError } = await supabaseClient
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customer.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              delivery_frequency: "weekly",
              next_delivery_date: session.metadata?.requested_delivery_date || null,
              delivery_notes: session.metadata?.order_notes || null,
              delivery_method: session.metadata?.delivery_method || "delivery",
              subscription_items: JSON.parse(session.metadata?.subscription_items || '[]'), // Store the actual items
              delivery_address: session.metadata?.delivery_address || null
            });

          if (subscriptionError) {
            console.error("Error creating user subscription:", subscriptionError);
          } else {
            // Send admin notification for new subscription
            try {
              await supabaseClient.functions.invoke('send-admin-notification', {
                body: {
                  type: 'subscription_started',
                  subscriptionId: subscription.id,
                  customerName: customer.name || getDisplayName(user.user_metadata),
                  customerEmail: customer.email || user.email || '',
                  planName: session.metadata?.plan_name || 'Weekly Subscription',
                  deliveryDate: session.metadata?.requested_delivery_date || null
                }
              });
              console.log("Admin notification sent for new subscription:", subscription.id);
            } catch (notifyError) {
              console.error("Failed to send admin notification for new subscription:", notifyError);
            }
          }

          console.log("Subscription created successfully for user:", user.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          console.log("Processing subscription payment success");
          
          // Update subscription status if needed
          const { error: updateError } = await supabaseClient
            .from("user_subscriptions")
            .update({ 
              status: "active",
              updated_at: new Date().toISOString()
            })
            .eq("stripe_subscription_id", invoice.subscription);

          if (updateError) {
            console.error("Error updating subscription status:", updateError);
          }

          // TODO: Create order record for this delivery cycle
          // This would create an order in your orders table for fulfillment
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("Processing subscription update");
        
        const { error: updateError } = await supabaseClient
          .from("user_subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log("Processing subscription cancellation");
        
        // Get customer info for notification
        let customerEmail = '';
        let customerName = '';
        try {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if (typeof customer !== "string" && !customer.deleted) {
            customerEmail = customer.email || '';
            customerName = customer.name || '';
          }
        } catch (err) {
          console.error("Error fetching customer for cancellation notification:", err);
        }
        
        const { error: cancelError } = await supabaseClient
          .from("user_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);

        if (cancelError) {
          console.error("Error cancelling subscription:", cancelError);
        }
        
        // Send admin notification for cancelled subscription
        try {
          await supabaseClient.functions.invoke('send-admin-notification', {
            body: {
              type: 'subscription_cancelled',
              subscriptionId: subscription.id,
              customerName: customerName,
              customerEmail: customerEmail,
              cancellationReason: subscription.cancellation_details?.reason || null
            }
          });
          console.log("Admin notification sent for cancelled subscription:", subscription.id);
        } catch (notifyError) {
          console.error("Failed to send admin notification for subscription cancellation:", notifyError);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in subscription webhook:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});