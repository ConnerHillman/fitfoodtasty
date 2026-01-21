import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import Handlebars from "npm:handlebars@4.7.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 'refund' | 'void' | 'gift_card_purchase' | 'gift_card_received';

interface NotificationRequest {
  notification_type: NotificationType;
  recipient_email: string;
  data: Record<string, unknown>;
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

    const body: NotificationRequest = await req.json();
    const { notification_type, recipient_email, data } = body;

    if (!notification_type || !recipient_email) {
      throw new Error("Missing required fields: notification_type and recipient_email");
    }

    console.log(`Sending ${notification_type} notification to ${recipient_email}`);

    // Map notification types to template types
    const templateTypeMap: Record<NotificationType, string> = {
      refund: 'refund',
      void: 'void',
      gift_card_purchase: 'gift_card_purchase',
      gift_card_received: 'gift_card_received',
    };

    const templateType = templateTypeMap[notification_type];

    // Fetch the template from order_email_templates
    const { data: template, error: templateError } = await supabaseClient
      .from('order_email_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      throw new Error(`Template not found for type: ${templateType}`);
    }

    // Prepare template context with all provided data and defaults
    const templateContext = {
      ...data,
      support_email: 'info@fitfoodtasty.co.uk',
      site_url: 'https://fitfoodtasty.co.uk',
      menu_url: 'https://fitfoodtasty.co.uk/menu',
    };

    // Compile and render templates
    const subjectTemplate = Handlebars.compile(template.subject_template);
    const htmlTemplate = Handlebars.compile(template.html_content);
    
    const renderedSubject = subjectTemplate(templateContext);
    const renderedHtml = htmlTemplate(templateContext);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>",
      to: [recipient_email],
      subject: renderedSubject,
      html: renderedHtml,
    });

    console.log("Notification email sent successfully:", emailResponse);

    // Log the email if it's order-related
    if (notification_type === 'refund' || notification_type === 'void') {
      const orderId = data.order_id as string;
      const orderType = data.order_type as string || 'individual';
      
      if (orderId) {
        await supabaseClient.from('order_emails').insert({
          order_id: orderId,
          order_type: orderType,
          email_type: notification_type,
          recipient_email: recipient_email,
          subject: renderedSubject,
          html_content: renderedHtml,
          template_id: template.id,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${notification_type} notification sent successfully`,
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in send-customer-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notification" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
