import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdjustOrderRequest {
  orderId: string;
  orderType: 'individual' | 'package';
  adjustmentType: 'discount' | 'refund' | 'fee';
  amount: number;
  reason: string;
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

    const { orderId, orderType, adjustmentType, amount, reason }: AdjustOrderRequest = await req.json();

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

    // Calculate new total
    let newTotal = order.total_amount;
    if (adjustmentType === 'discount' || adjustmentType === 'refund') {
      newTotal = Math.max(0, newTotal - amount);
    } else if (adjustmentType === 'fee') {
      newTotal = newTotal + amount;
    }

    // Log the change
    await supabaseClient.rpc('log_order_change', {
      p_order_id: orderId,
      p_order_type: orderType,
      p_action_type: 'adjust',
      p_performed_by: userData.user.id,
      p_old_values: { total_amount: order.total_amount },
      p_new_values: { total_amount: newTotal },
      p_reason: reason,
      p_amount_changed: adjustmentType === 'fee' ? amount : -amount,
      p_metadata: { adjustment_type: adjustmentType }
    });

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from(tableName)
      .update({
        total_amount: newTotal,
        last_modified_by: userData.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    // If it's a refund and we have a Stripe session, process the refund
    if (adjustmentType === 'refund' && order.stripe_session_id && amount > 0) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        // Get the payment intent from the session
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        if (session.payment_intent && typeof session.payment_intent === 'string') {
          // Process refund
          await stripe.refunds.create({
            payment_intent: session.payment_intent,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              order_id: orderId,
              order_type: orderType,
              adjustment_reason: reason
            }
          });

          // Update refund tracking
          await supabaseClient
            .from(tableName)
            .update({
              refund_amount: (order.refund_amount || 0) + amount,
              refund_reason: reason
            })
            .eq('id', orderId);
        }
      } catch (stripeError) {
        console.error('Stripe refund failed:', stripeError);
        // Don't fail the entire operation if Stripe fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      order: updatedOrder,
      message: `Order ${adjustmentType} applied successfully`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in adjust-order:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to adjust order' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});