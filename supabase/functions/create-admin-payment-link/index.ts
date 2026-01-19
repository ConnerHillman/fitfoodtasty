import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-PAYMENT-LINK] ${step}${detailsStr}`);
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
    logStep('Creating payment link order', { customer: orderData.customer_email });

    const origin = req.headers.get('origin') || 'https://fitfoodtasty.lovable.app';

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

    // Create the order with pending_payment status
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: customerId,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        delivery_address: orderData.delivery_address,
        total_amount: orderData.total_amount,
        status: 'pending_payment',
        currency: 'gbp',
        order_notes: orderData.order_notes,
        requested_delivery_date: orderData.requested_delivery_date,
        last_modified_by: user.id,
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

    // Create Stripe Checkout Session for the payment link
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Look up or create Stripe customer
    let stripeCustomerId: string | undefined;
    const customers = await stripe.customers.list({ email: orderData.customer_email, limit: 1 });
    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : orderData.customer_email,
      line_items: orderData.meal_selections.map((item: any) => ({
        price_data: {
          currency: 'gbp',
          product_data: { 
            name: item.meal_name,
            description: `Quantity: ${item.quantity}`,
          },
          unit_amount: Math.round(item.unit_price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${origin}/payment-success?order_id=${order.id}`,
      cancel_url: `${origin}/orders`,
      metadata: { 
        order_id: order.id,
        admin_order: 'true',
        created_by: user.id,
      },
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hour expiry
    });

    logStep('Checkout session created', { sessionId: session.id, url: session.url });

    // Update order with stripe payment intent info
    if (session.payment_intent) {
      await supabaseClient
        .from('orders')
        .update({ stripe_payment_intent_id: session.payment_intent as string })
        .eq('id', order.id);
    }

    // Log the admin action
    await supabaseClient
      .from('order_audit_log')
      .insert({
        order_id: order.id,
        order_type: 'individual',
        action_type: 'admin_payment_link',
        performed_by: user.id,
        reason: 'Payment link generated by admin',
        metadata: {
          admin_notes: orderData.admin_notes,
          checkout_session_id: session.id,
          payment_link_url: session.url,
        }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      paymentUrl: session.url,
      message: `Payment link created for ${orderData.customer_name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
