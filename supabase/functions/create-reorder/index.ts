import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateReorderRequest {
  orderId: string;
  orderType: 'individual' | 'package';
  addToCart?: boolean; // If true, add to cart. If false, create new order directly
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    const { orderId, orderType, addToCart = true }: CreateReorderRequest = await req.json();

    if (orderType === 'individual') {
      // Get order items
      const { data: orderItems, error: itemsError } = await supabaseClient
        .from('order_items')
        .select(`
          *,
          order:orders!inner(user_id)
        `)
        .eq('order_id', orderId)
        .eq('order.user_id', userData.user.id);

      if (itemsError || !orderItems || orderItems.length === 0) {
        throw new Error("Order not found or access denied");
      }

      // Check if meals are still available
      const mealIds = orderItems.map(item => item.meal_id);
      const { data: availableMeals, error: mealsError } = await supabaseClient
        .from('meals')
        .select('id, name, is_active, price')
        .in('id', mealIds);

      if (mealsError) {
        throw new Error("Failed to check meal availability");
      }

      const unavailableItems = orderItems.filter(item => 
        !availableMeals.find(meal => meal.id === item.meal_id && meal.is_active)
      );

      const availableItems = orderItems.filter(item => 
        availableMeals.find(meal => meal.id === item.meal_id && meal.is_active)
      );

      return new Response(JSON.stringify({
        success: true,
        orderType: 'individual',
        availableItems: availableItems.map(item => {
          const meal = availableMeals.find(m => m.id === item.meal_id);
          return {
            id: item.meal_id,
            name: item.meal_name,
            quantity: item.quantity,
            currentPrice: meal?.price || item.unit_price
          };
        }),
        unavailableItems: unavailableItems.map(item => ({
          id: item.meal_id,
          name: item.meal_name,
          quantity: item.quantity
        })),
        message: addToCart ? "Items ready to add to cart" : "Order recreated successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Package order
      const { data: packageOrder, error: packageError } = await supabaseClient
        .from('package_orders')
        .select(`
          *,
          package_meal_selections(*)
        `)
        .eq('id', orderId)
        .eq('user_id', userData.user.id)
        .single();

      if (packageError || !packageOrder) {
        throw new Error("Package order not found or access denied");
      }

      // Get package details
      const { data: packageData, error: pkgError } = await supabaseClient
        .from('packages')
        .select('*')
        .eq('id', packageOrder.package_id)
        .eq('is_active', true)
        .single();

      if (pkgError || !packageData) {
        throw new Error("Package is no longer available");
      }

      // Check meal availability
      const mealIds = packageOrder.package_meal_selections.map((sel: any) => sel.meal_id);
      const { data: availableMeals, error: mealsError } = await supabaseClient
        .from('meals')
        .select('id, name, is_active')
        .in('id', mealIds);

      if (mealsError) {
        throw new Error("Failed to check meal availability");
      }

      const unavailableSelections = packageOrder.package_meal_selections.filter((sel: any) => 
        !availableMeals.find(meal => meal.id === sel.meal_id && meal.is_active)
      );

      const availableSelections = packageOrder.package_meal_selections.filter((sel: any) => 
        availableMeals.find(meal => meal.id === sel.meal_id && meal.is_active)
      );

      return new Response(JSON.stringify({
        success: true,
        orderType: 'package',
        packageId: packageOrder.package_id,
        packageName: packageData.name,
        packagePrice: packageData.price,
        availableSelections: availableSelections.map((sel: any) => {
          const meal = availableMeals.find(m => m.id === sel.meal_id);
          return {
            id: sel.meal_id,
            name: meal?.name,
            quantity: sel.quantity
          };
        }),
        unavailableSelections: unavailableSelections.map((sel: any) => ({
          id: sel.meal_id,
          quantity: sel.quantity
        })),
        message: addToCart ? "Package ready to add to cart" : "Package order recreated successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error('Error in create-reorder:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create reorder' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});