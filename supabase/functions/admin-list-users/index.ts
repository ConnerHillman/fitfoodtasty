import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No valid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token for auth validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Token validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Check if user has admin role using service client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Role check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData) {
      console.log("User is not an admin:", userId);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin access confirmed for user:", userId);

    // Now safely list users using service role
    const { data: authData, error: listError } = await serviceClient.auth.admin.listUsers();

    if (listError) {
      console.error("Failed to list users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all user roles
    const { data: allRoles, error: allRolesError } = await serviceClient
      .from("user_roles")
      .select("user_id, role");

    if (allRolesError) {
      console.error("Failed to fetch roles:", allRolesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper function to get display name safely
    const getDisplayName = (metadata: any, email: string): string => {
      const firstName = metadata?.first_name?.trim() || metadata?.given_name?.trim() || '';
      const lastName = metadata?.last_name?.trim() || metadata?.family_name?.trim() || '';
      
      if (firstName || lastName) {
        return [firstName, lastName].filter(Boolean).join(' ');
      }
      
      if (metadata?.full_name?.trim()) {
        return metadata.full_name.trim();
      }
      
      if (metadata?.name?.trim()) {
        return metadata.name.trim();
      }
      
      // Fallback to email prefix
      return email?.split('@')[0] || 'Unknown';
    };

    // Combine users with their roles
    const usersWithRoles = authData.users.map((user) => {
      const userRoles = allRoles
        ?.filter((r) => r.user_id === user.id)
        .map((r) => r.role) || [];
      
      return {
        id: user.id,
        email: user.email || "",
        full_name: getDisplayName(user.user_metadata, user.email || ""),
        created_at: user.created_at,
        roles: userRoles,
      };
    });

    console.log(`Returning ${usersWithRoles.length} users`);

    return new Response(
      JSON.stringify({ users: usersWithRoles }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
