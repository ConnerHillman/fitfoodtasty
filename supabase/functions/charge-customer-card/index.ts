import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHARGE-CUSTOMER-CARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Admin access required');
    }

    const orderData = await req.json();
    logStep('Charging customer card', { 
      customer: orderData.customer_email,
      paymentMethodId: orderData.payment_method_id,
      amount: orderData.total_amount 
    });

    if (!orderData.payment_method_id) {
      throw new Error('Payment method ID is required');
    }

    if (!orderData.stripe_customer_id) {
      throw new Error('Stripe customer ID is required');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find existing customer ID if any
    let customerId = null;
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const existingCustomer = existingUser?.users?.find(u => u.email === orderData.customer_email);
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else if (orderData.is_new_customer) {
      // Create new customer account
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: orderData.customer_email,
        password: Math.random().toString(36).slice(-12),
        email_confirm: true,
        user_metadata: {
          full_name: orderData.customer_name,
          phone: orderData.customer_phone,
          delivery_address: orderData.delivery_address,
          postal_code: orderData.postal_code,
        }
      });

      if (createError) throw createError;
      customerId = newUser.user.id;
    }

    // Create PaymentIntent and charge the card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orderData.total_amount * 100),
      currency: 'gbp',
      customer: orderData.stripe_customer_id,
      payment_method: orderData.payment_method_id,
      off_session: true,
      confirm: true,
      metadata: { 
        admin_order: 'true',
        created_by: user.id,
        customer_email: orderData.customer_email,
      },
      description: `Admin order for ${orderData.customer_name}`,
    });

    logStep('Payment intent created', { 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status 
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    // Create the order with confirmed status
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: customerId,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        delivery_address: orderData.delivery_address,
        total_amount: orderData.total_amount,
        status: 'confirmed',
        currency: 'gbp',
        order_notes: orderData.order_notes,
        requested_delivery_date: orderData.requested_delivery_date,
        last_modified_by: user.id,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (orderError) throw orderError;
    logStep('Order created', { orderId: order.id });

    // Create order items
    const orderItems = orderData.meal_selections.map((item: any) => ({
      order_id: order.id,
      meal_id: item.meal_id,
      meal_name: item.meal_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Log the admin action
    await supabaseClient
      .from('order_audit_log')
      .insert({
        order_id: order.id,
        order_type: 'individual',
        action_type: 'admin_card_charge',
        performed_by: user.id,
        reason: 'Card charged by admin',
        metadata: {
          admin_notes: orderData.admin_notes,
          payment_intent_id: paymentIntent.id,
          payment_method_id: orderData.payment_method_id,
          amount_charged: orderData.total_amount,
        }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      message: `Card charged successfully for ${orderData.customer_name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return new Response(JSON.stringify({ 
        error: `Card declined: ${error.message}`,
        code: error.code 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
