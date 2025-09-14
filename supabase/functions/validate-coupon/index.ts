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

    // Get the coupon code from request body
    const { code } = await req.json();
    
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

    console.log(`Valid coupon found: ${code} with ${coupon.discount_percentage}% discount`);

    return new Response(
      JSON.stringify({
        valid: true,
        discount_percentage: coupon.discount_percentage,
        code: coupon.code
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