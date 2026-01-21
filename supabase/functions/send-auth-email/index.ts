import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import Handlebars from "npm:handlebars@4.7.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  email_type: 'password_reset' | 'email_verification' | 'magic_link';
  token?: string;
  redirect_url?: string;
  user_metadata?: {
    first_name?: string;
    full_name?: string;
    name?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: AuthEmailRequest = await req.json();
    const { email, email_type, token, redirect_url, user_metadata } = body;

    if (!email || !email_type) {
      throw new Error("Missing required fields: email and email_type");
    }

    console.log(`Sending ${email_type} email to ${email}`);

    // Fetch the template from the database
    const { data: template, error: templateError } = await supabaseClient
      .from('auth_email_templates')
      .select('*')
      .eq('email_type', email_type)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      throw new Error(`Template not found for email type: ${email_type}`);
    }

    // Determine customer name
    const customerName = user_metadata?.first_name || 
                         user_metadata?.full_name?.split(' ')[0] || 
                         user_metadata?.name?.split(' ')[0] || 
                         '';

    // Build the appropriate URL based on email type
    const baseUrl = Deno.env.get("SITE_URL") || "https://fitfoodtasty.co.uk";
    let actionUrl = redirect_url || baseUrl;
    
    if (token) {
      if (email_type === 'password_reset') {
        actionUrl = `${baseUrl}/auth/callback?token=${token}&type=recovery&redirect_to=${baseUrl}/account`;
      } else if (email_type === 'email_verification') {
        actionUrl = `${baseUrl}/auth/callback?token=${token}&type=signup&redirect_to=${baseUrl}`;
      } else if (email_type === 'magic_link') {
        actionUrl = `${baseUrl}/auth/callback?token=${token}&type=magiclink&redirect_to=${baseUrl}`;
      }
    }

    // Prepare template context
    const templateContext = {
      customer_name: customerName,
      has_customer_name: !!customerName,
      reset_url: actionUrl,
      verification_url: actionUrl,
      magic_link_url: actionUrl,
      email: email,
      site_url: baseUrl,
      support_email: 'info@fitfoodtasty.co.uk',
    };

    // Compile and render templates
    const subjectTemplate = Handlebars.compile(template.subject_template);
    const htmlTemplate = Handlebars.compile(template.html_content);
    
    const renderedSubject = subjectTemplate(templateContext);
    const renderedHtml = htmlTemplate(templateContext);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>",
      to: [email],
      subject: renderedSubject,
      html: renderedHtml,
    });

    console.log("Auth email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${email_type} email sent successfully`,
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in send-auth-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send auth email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
