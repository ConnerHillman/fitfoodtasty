import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const authHeader = req.headers.get("Authorization")!;
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

    const { orderId, orderType, amount, reason, notifyCustomer }: ProcessRefundRequest = await req.json();

    // Get the order
    const tableName = orderType === 'package' ? 'package_orders' : 'orders';
    const { data: order, error: orderError } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (!order.stripe_session_id) {
      throw new Error("No payment session found for this order");
    }

    if (amount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }

    const maxRefund = order.total_amount - (order.refund_amount || 0);
    if (amount > maxRefund) {
      throw new Error(`Refund amount cannot exceed £${maxRefund.toFixed(2)}`);
    }

    // Process refund through Stripe
    let refundId = '';
    try {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      // Get the payment intent from the session
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      
      if (!session.payment_intent || typeof session.payment_intent !== 'string') {
        throw new Error("No payment intent found for this order");
      }

      // Process refund
      const refund = await stripe.refunds.create({
        payment_intent: session.payment_intent,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          order_id: orderId,
          order_type: orderType,
          refund_reason: reason
        }
      });

      refundId = refund.id;

    } catch (stripeError) {
      console.error('Stripe refund failed:', stripeError);
      throw new Error(`Failed to process refund: ${stripeError.message}`);
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