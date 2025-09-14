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
    console.log("validate-coupon function called");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the coupon code and cart total from request body
    const { code, cart_total } = await req.json();
    
    if (!code) {
      console.log("No coupon code provided");
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Validating coupon code: ${code}`);

    // Query the coupons table for an active coupon with the provided code
    const { data: coupon, error } = await supabaseClient
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ valid: false, error: "Database error occurred" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!coupon) {
      console.log(`Coupon not found or inactive: ${code}`);
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired coupon" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if coupon has expired
    if (coupon.expires_at) {
      const now = new Date();
      const expirationDate = new Date(coupon.expires_at);
      
      if (now > expirationDate) {
        console.log(`Coupon expired: ${code} - expired on ${expirationDate.toISOString()}`);
        return new Response(
          JSON.stringify({ valid: false, error: "Coupon has expired" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Check minimum order value requirement
    if (coupon.min_order_value && cart_total < coupon.min_order_value) {
      console.log(`Cart total ${cart_total} below minimum required ${coupon.min_order_value}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Minimum order value of £${coupon.min_order_value} required` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Determine discount type
    let discountType = "percentage";
    if (coupon.discount_amount && coupon.discount_amount > 0) {
      discountType = "fixed_amount";
    } else if (coupon.free_delivery) {
      discountType = "free_delivery";
    } else if (coupon.free_item_id) {
      discountType = "free_item";
    }

    console.log(`Valid coupon found: ${code} - Type: ${discountType}`);

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: coupon,
        discount_type: discountType
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in validate-coupon function:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});