import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";
import Handlebars from "npm:handlebars@4.7.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
}

serve(async (req) => {
  console.log('[send-welcome-email] Function invoked', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { email, name }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} (${name})`);

    if (!email) {
      throw new Error('Email is required');
    }

    // Get active welcome email template
    const { data: template, error: templateError } = await supabase
      .from('order_email_templates')
      .select('*')
      .eq('template_type', 'welcome')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (templateError) {
      console.error('Error fetching template:', templateError);
    }

    // If no template found, use a default inline template
    let subject = 'Welcome to Fit Food Tasty!';
    let htmlContent = '';

    if (template) {
      console.log(`Using template: ${template.template_name}`);
      
      // Prepare variables for Handlebars
      const variables = {
        customer_name: name || 'there',
        customer_email: email,
        business_name: 'Fit Food Tasty',
        business_phone: '07961 719602',
        business_address: 'Unit F, Cartwright Mill Business Centre, Brue Avenue, Bridgwater, Somerset, TA6 5LT',
        website_url: 'https://fitfoodtasty.co.uk',
        menu_url: 'https://fitfoodtasty.co.uk/menu',
        current_year: new Date().getFullYear(),
      };

      // Compile templates with Handlebars
      const compiledSubject = Handlebars.compile(template.subject_template);
      const compiledHtml = Handlebars.compile(template.html_content);

      subject = compiledSubject(variables);
      htmlContent = compiledHtml(variables);
    } else {
      // Default fallback template
      console.log('No active welcome template found, using default');
      
      const customerName = name || 'there';
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2D5A27; margin-bottom: 10px;">Welcome to Fit Food Tasty!</h1>
          </div>
          
          <p>Hi ${customerName},</p>
          
          <p>Thank you for creating an account with Fit Food Tasty! We're thrilled to have you join our community of health-conscious food lovers.</p>
          
          <p>Here's what you can expect from us:</p>
          
          <ul style="margin: 20px 0; padding-left: 20px;">
            <li>🥗 Fresh, nutritious meals prepared with quality ingredients</li>
            <li>🚚 Convenient delivery or collection options</li>
            <li>📅 Flexible ordering to fit your schedule</li>
            <li>💪 Meals designed to support your health goals</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fitfoodtasty.co.uk/menu" 
               style="background-color: #2D5A27; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Browse Our Menu
            </a>
          </div>
          
          <p>If you have any questions, feel free to reach out to us at any time. We're here to help!</p>
          
          <p>Warm regards,<br>
          <strong>The Fit Food Tasty Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            Fit Food Tasty<br>
            Unit F, Cartwright Mill Business Centre, Brue Avenue, Bridgwater, Somerset, TA6 5LT<br>
            Phone: 07961 719602
          </p>
        </body>
        </html>
      `;
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log(`Welcome email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        recipient: email 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
