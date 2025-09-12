import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface CartData {
  user_id?: string;
  session_id?: string;
  customer_email?: string;
  customer_name?: string;
  cart_items: any[];
  total_amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, cart_data }: { action: string; cart_data: CartData } = await req.json();

    console.log("Cart tracking action:", action, cart_data);

    if (action === "abandon") {
      // Create or update abandoned cart
      const abandonedCart = {
        user_id: cart_data.user_id,
        session_id: cart_data.session_id,
        customer_email: cart_data.customer_email,
        customer_name: cart_data.customer_name,
        cart_items: cart_data.cart_items,
        total_amount: cart_data.total_amount,
        abandoned_at: new Date().toISOString(),
      };

      // Check if cart already exists for this user/session
      let existingCartQuery = supabase.from("abandoned_carts").select("*");
      
      if (cart_data.user_id) {
        existingCartQuery = existingCartQuery.eq("user_id", cart_data.user_id);
      } else if (cart_data.session_id) {
        existingCartQuery = existingCartQuery.eq("session_id", cart_data.session_id);
      }

      const { data: existingCarts } = await existingCartQuery
        .is("recovered_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingCarts && existingCarts.length > 0) {
        // Update existing cart
        const { error } = await supabase
          .from("abandoned_carts")
          .update(abandonedCart)
          .eq("id", existingCarts[0].id);

        if (error) throw error;

        console.log("Updated existing abandoned cart:", existingCarts[0].id);
      } else {
        // Create new abandoned cart
        const { error } = await supabase
          .from("abandoned_carts")
          .insert(abandonedCart);

        if (error) throw error;

        console.log("Created new abandoned cart");
      }
    } else if (action === "recover") {
      // Mark cart as recovered
      let query = supabase.from("abandoned_carts").update({
        recovered_at: new Date().toISOString(),
        recovery_order_id: cart_data.user_id, // This would be the actual order ID
      });

      if (cart_data.user_id) {
        query = query.eq("user_id", cart_data.user_id);
      } else if (cart_data.session_id) {
        query = query.eq("session_id", cart_data.session_id);
      }

      const { error } = await query.is("recovered_at", null);

      if (error) throw error;

      console.log("Marked cart as recovered");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in cart tracking:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);