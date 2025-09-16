import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoidOrderRequest {
  orderId: string;
  orderType: 'individual' | 'package';
  reason: string;
  processRefund: boolean;
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

    const { orderId, orderType, reason, processRefund, notifyCustomer }: VoidOrderRequest = await req.json();

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

    if (order.status === 'voided') {
      throw new Error("Order is already voided");
    }

    // Process refund if requested and Stripe session exists
    let refundAmount = 0;
    if (processRefund && order.stripe_session_id && order.total_amount > 0) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        // Get the payment intent from the session
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        if (session.payment_intent && typeof session.payment_intent === 'string') {
          // Process full refund
          const refund = await stripe.refunds.create({
            payment_intent: session.payment_intent,
            reason: 'requested_by_customer',
            metadata: {
              order_id: orderId,
              order_type: orderType,
              void_reason: reason
            }
          });

          refundAmount = refund.amount / 100; // Convert from cents
        }
      } catch (stripeError) {
        console.error('Stripe refund failed:', stripeError);
        throw new Error(`Failed to process refund: ${stripeError.message}`);
      }
    }

    // Log the void action
    await supabaseClient.rpc('log_order_change', {
      p_order_id: orderId,
      p_order_type: orderType,
      p_action_type: 'void',
      p_performed_by: userData.user.id,
      p_old_values: { status: order.status },
      p_new_values: { status: 'voided' },
      p_reason: reason,
      p_amount_changed: -refundAmount,
      p_metadata: { 
        refund_processed: processRefund,
        refund_amount: refundAmount,
        notify_customer: notifyCustomer
      }
    });

    // Update the order status
    const updateData: any = {
      status: 'voided',
      voided_at: new Date().toISOString(),
      voided_by: userData.user.id,
      last_modified_by: userData.user.id,
      updated_at: new Date().toISOString()
    };

    if (refundAmount > 0) {
      updateData.refund_amount = refundAmount;
      updateData.refund_reason = reason;
    }

    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to void order: ${updateError.message}`);
    }

    // TODO: Send notification email to customer if notifyCustomer is true
    if (notifyCustomer) {
      console.log(`Should notify customer about voided order ${orderId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      refundAmount,
      message: `Order voided successfully${refundAmount > 0 ? ` with £${refundAmount.toFixed(2)} refund` : ''}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in void-order:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to void order' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});