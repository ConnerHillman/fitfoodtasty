import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization')!;
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
    console.log('Creating admin order:', orderData);

    // Find or create customer user
    let customerId = null;
    
    // Check if customer already exists
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
    } else {
      // Create as guest order (no user account)
      customerId = null;
    }

    // Create the order
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
      })
      .select()
      .single();

    if (orderError) throw orderError;

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
        action_type: 'admin_create',
        performed_by: user.id,
        reason: 'Manual order created by admin',
        metadata: {
          admin_notes: orderData.admin_notes,
          price_overrides: orderData.meal_selections.filter((item: any) => item.unit_price !== item.original_price),
          delivery_zone_id: orderData.delivery_zone_id,
        }
      });

    console.log('Admin order created successfully:', order.id);

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      message: `Order created for ${orderData.customer_name}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error creating admin order:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create admin order'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});