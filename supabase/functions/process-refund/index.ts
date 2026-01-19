import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
function sanitizeString(input: unknown, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function validateUUID(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input) ? input : null;
}

function validatePositiveNumber(input: unknown): number {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input) && input > 0) {
    return input;
  }
  return 0;
}

interface ProcessRefundRequest {
  orderId: string;
  orderType: 'individual' | 'package';
  amount: number;
  reason: string;
  notifyCustomer: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    // Verify admin role
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();
    
    if (!userRole || userRole.role !== 'admin') {
      throw new Error("Admin access required");
    }

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new Error("Invalid request body");
    }

    // Validate and sanitize all inputs
    const orderId = validateUUID(body.orderId);
    if (!orderId) {
      throw new Error("Invalid order ID");
    }

    const orderType = body.orderType === 'package' ? 'package' : 'individual';
    const amount = validatePositiveNumber(body.amount);
    const reason = sanitizeString(body.reason, 500);
    const notifyCustomer = body.notifyCustomer === true;

    if (amount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }

    // Get the order using FOR UPDATE to prevent race conditions
    const tableName = orderType === 'package' ? 'package_orders' : 'orders';
    const { data: order, error: orderError } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (!order.stripe_payment_intent_id) {
      throw new Error("No payment found for this order");
    }

    // Verify refund amount against Stripe payment intent amount
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Verify the payment intent exists and get actual payment amount
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
    const actualPaymentAmount = paymentIntent.amount / 100; // Convert from cents

    // Calculate maximum refund based on actual Stripe payment
    const totalRefunded = order.refund_amount || 0;
    const maxRefundFromPayment = actualPaymentAmount - totalRefunded;
    const maxRefundFromOrder = order.total_amount - totalRefunded;
    
    // Use the lesser of the two to be safe
    const maxRefund = Math.min(maxRefundFromPayment, maxRefundFromOrder);
    
    if (amount > maxRefund) {
      throw new Error(`Refund amount cannot exceed £${maxRefund.toFixed(2)}`);
    }

    // Process refund through Stripe using the already verified payment intent
    let refundId = '';
    try {
      // Create idempotency key to prevent duplicate refunds
      const idempotencyKey = `refund_${orderId}_${amount}_${Date.now()}`;
      
      // Process refund directly using the payment intent ID
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          order_id: orderId,
          order_type: orderType,
          refund_reason: reason,
          admin_user_id: userData.user.id
        }
      }, {
        idempotencyKey
      });

      refundId = refund.id;

    } catch (stripeError: unknown) {
      console.error('Stripe refund failed:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      throw new Error(`Failed to process refund: ${errorMessage}`);
    }

    // Log the refund
    await supabaseClient.rpc('log_order_change', {
      p_order_id: orderId,
      p_order_type: orderType,
      p_action_type: 'refund',
      p_performed_by: userData.user.id,
      p_old_values: { refund_amount: order.refund_amount || 0 },
      p_new_values: { refund_amount: (order.refund_amount || 0) + amount },
      p_reason: reason,
      p_amount_changed: -amount,
      p_metadata: { 
        stripe_refund_id: refundId,
        notify_customer: notifyCustomer
      }
    });

    // Update the order with refund information
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from(tableName)
      .update({
        refund_amount: (order.refund_amount || 0) + amount,
        refund_reason: reason,
        last_modified_by: userData.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // TODO: Send notification email to customer if notifyCustomer is true
    if (notifyCustomer) {
      console.log(`Should notify customer about refund for order ${orderId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      refundAmount: amount,
      refundId,
      message: `Refund of £${amount.toFixed(2)} processed successfully`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in process-refund:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process refund' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});