import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MANUAL-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    // Check if user has admin role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    logStep("Admin authentication verified", { userId: userData.user.id });

    // Parse request body
    const orderData = await req.json();
    logStep("Order data received", { orderType: orderData.order_type, mealsCount: orderData.meal_selections?.length });

    // Validate required fields
    if (!orderData.customer_email || !orderData.customer_name) {
      throw new Error("Customer email and name are required");
    }

    if (!orderData.meal_selections || orderData.meal_selections.length === 0) {
      throw new Error("At least one meal selection is required");
    }

    // Find or create customer user
    let customerId: string | null = null;
    
    // First, try to find existing user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === orderData.customer_email);
    
    if (existingUser) {
      customerId = existingUser.id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create new user if doesn't exist
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: orderData.customer_email,
        email_confirm: true,
        user_metadata: {
          full_name: orderData.customer_name
        }
      });

      if (createUserError) {
        logStep("Failed to create user", { error: createUserError });
        throw new Error(`Failed to create customer user: ${createUserError.message}`);
      }

      customerId = newUser.user.id;
      logStep("Created new customer", { customerId });

      // Create profile for new user
      await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: customerId,
          full_name: orderData.customer_name,
          delivery_address: orderData.delivery_address || ''
        });
    }

    // Calculate order totals
    const subtotal = orderData.meal_selections.reduce((sum: number, selection: any) => 
      sum + (selection.price * selection.quantity), 0
    );
    const totalAmount = subtotal + (orderData.delivery_fee || 0) - (orderData.discount_amount || 0);

    // Calculate delivery date
    const deliveryDate = orderData.requested_delivery_date ? 
      new Date(orderData.requested_delivery_date) : 
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days from now

    // Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: customerId,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        delivery_address: orderData.delivery_address || '',
        total_amount: totalAmount,
        status: orderData.payment_method === 'complimentary' ? 'confirmed' : 'pending',
        currency: 'gbp',
        order_notes: `Manual Order (${orderData.order_type}) - Payment: ${orderData.payment_method}${orderData.order_notes ? '\n' + orderData.order_notes : ''}`,
        requested_delivery_date: deliveryDate.toISOString().split('T')[0],
        discount_amount: orderData.discount_amount || 0,
        last_modified_by: userData.user.id
      })
      .select()
      .single();

    if (orderError) {
      logStep("Failed to create order", { error: orderError });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id, totalAmount });

    // Create order items
    const orderItems = orderData.meal_selections.map((selection: any) => ({
      order_id: order.id,
      meal_id: selection.meal_id,
      meal_name: selection.meal_name,
      quantity: selection.quantity,
      unit_price: selection.price,
      total_price: selection.price * selection.quantity
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // If order items fail, clean up the order
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      logStep("Failed to create order items", { error: itemsError });
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    logStep("Order items created", { itemsCount: orderItems.length });

    // Log the manual order creation for audit purposes
    await supabaseAdmin
      .from('order_audit_log')
      .insert({
        order_id: order.id,
        order_type: 'individual',
        action_type: 'manual_creation',
        performed_by: userData.user.id,
        new_values: {
          order_type: orderData.order_type,
          payment_method: orderData.payment_method,
          created_by_admin: true
        },
        reason: `Manual order created via admin panel - Type: ${orderData.order_type}`,
        metadata: {
          meal_selections_count: orderData.meal_selections.length,
          delivery_fee: orderData.delivery_fee || 0,
          discount_amount: orderData.discount_amount || 0
        }
      });

    logStep("Audit log created");

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      order_number: order.id.slice(-8).toUpperCase(),
      total_amount: totalAmount,
      customer_id: customerId,
      status: order.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});