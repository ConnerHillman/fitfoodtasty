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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("Validating gift card...");
    
    const { code, amount_to_use } = await req.json();

    if (!code) {
      throw new Error("Gift card code is required");
    }

    console.log("Validating code:", code, "Amount to use:", amount_to_use);

    // Use the database function to validate the gift card
    const { data: result, error } = await supabaseClient
      .rpc('validate_gift_card', { 
        gift_card_code: code,
        amount_to_use: amount_to_use || null
      });

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to validate gift card");
    }

    console.log("Validation result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error validating gift card:", error);
    return new Response(JSON.stringify({ 
      valid: false,
      error: error.message || "Failed to validate gift card" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});