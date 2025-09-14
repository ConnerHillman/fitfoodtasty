import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userEmail, packageId, customerName, deliveryAddress } = await req.json();

    // Get user ID
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;
    
    const user = users.users.find(u => u.email === userEmail);
    if (!user) throw new Error("User not found");

    // Get package details
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();
    
    if (packageError) throw packageError;

    // Create package order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('package_orders')
      .insert({
        user_id: user.id,
        package_id: packageId,
        customer_name: customerName,
        customer_email: userEmail,
        delivery_address: deliveryAddress,
        total_amount: packageData.price,
        currency: 'gbp',
        status: 'confirmed',
        requested_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        production_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 day from now
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Get some random meals for the package
    const { data: meals, error: mealsError } = await supabaseAdmin
      .from('meals')
      .select('id, name')
      .eq('is_active', true)
      .limit(packageData.meal_count);

    if (mealsError) throw mealsError;

    // Create meal selections
    const mealSelections = meals.map(meal => ({
      package_order_id: orderData.id,
      meal_id: meal.id,
      quantity: 1
    }));

    const { error: selectionsError } = await supabaseAdmin
      .from('package_meal_selections')
      .insert(mealSelections);

    if (selectionsError) throw selectionsError;

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: orderData.id,
      orderDetails: orderData,
      meals: meals
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating test order:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});