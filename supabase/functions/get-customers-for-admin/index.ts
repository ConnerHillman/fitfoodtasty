import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching customers for admin...');

    // Get profiles data first
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, full_name, phone, delivery_address, city, postal_code')
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // Get auth users with service role key
    const { data: authResponse, error: authError } = await supabaseClient.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      // Fallback to profiles only if auth fails
      const customersWithoutEmail = (profiles || []).map(profile => ({
        ...profile,
        email: `user_${profile.user_id.slice(0, 8)}@customer.local`,
        email_verified: false
      }));
      
      return new Response(JSON.stringify({ 
        customers: customersWithoutEmail,
        warning: 'Could not fetch verified emails, showing placeholder emails'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${authResponse?.users?.length || 0} auth users`);

    // Combine profiles with real email addresses
    const customers = (profiles || []).map(profile => {
      const authUser = authResponse?.users?.find((user: any) => user.id === profile.user_id);
      return {
        ...profile,
        email: authUser?.email || `user_${profile.user_id.slice(0, 8)}@customer.local`,
        email_verified: !!authUser?.email,
        created_at: authUser?.created_at,
        last_sign_in_at: authUser?.last_sign_in_at
      };
    }).filter(customer => customer.full_name); // Only include customers with names

    console.log(`Returning ${customers.length} customers with email data`);

    return new Response(JSON.stringify({ customers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in get-customers-for-admin function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch customers',
      details: error 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});