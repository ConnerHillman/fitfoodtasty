import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

interface AbandonedCart {
  id: string;
  user_id?: string;
  customer_email?: string;
  customer_name?: string;
  cart_items: any[];
  total_amount: number;
  abandoned_at: string;
  session_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting abandoned cart recovery process...");

    // Get settings
    const { data: settings } = await supabase
      .from("abandoned_cart_settings")
      .select("*");

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.setting_name] = setting.setting_value;
      return acc;
    }, {} as Record<string, string>) || {};

    const emailEnabled = settingsMap.email_enabled === "true";
    const firstEmailDelay = parseInt(settingsMap.first_email_delay_hours || "1");
    const secondEmailDelay = parseInt(settingsMap.second_email_delay_hours || "24");
    const thirdEmailDelay = parseInt(settingsMap.third_email_delay_hours || "72");

    if (!emailEnabled) {
      console.log("Abandoned cart emails are disabled");
      return new Response(JSON.stringify({ message: "Emails disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email settings:", { firstEmailDelay, secondEmailDelay, thirdEmailDelay });

    // Find abandoned carts that need emails
    const now = new Date();
    const firstEmailThreshold = new Date(now.getTime() - firstEmailDelay * 60 * 60 * 1000);
    const secondEmailThreshold = new Date(now.getTime() - secondEmailDelay * 60 * 60 * 1000);
    const thirdEmailThreshold = new Date(now.getTime() - thirdEmailDelay * 60 * 60 * 1000);

    // Get abandoned carts that haven't been recovered
    const { data: abandonedCarts, error: cartsError } = await supabase
      .from("abandoned_carts")
      .select("*")
      .is("recovered_at", null)
      .not("customer_email", "is", null);

    if (cartsError) {
      console.error("Error fetching abandoned carts:", cartsError);
      throw cartsError;
    }

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts`);

    for (const cart of abandonedCarts || []) {
      const abandonedAt = new Date(cart.abandoned_at);
      
      // Check what emails have been sent
      const { data: sentEmails } = await supabase
        .from("abandoned_cart_emails")
        .select("email_type")
        .eq("abandoned_cart_id", cart.id);

      const emailTypes = sentEmails?.map(e => e.email_type) || [];

      let shouldSendEmail = false;
      let emailType = "";

      // Determine which email to send
      if (!emailTypes.includes("first") && abandonedAt <= firstEmailThreshold) {
        shouldSendEmail = true;
        emailType = "first";
      } else if (!emailTypes.includes("second") && abandonedAt <= secondEmailThreshold) {
        shouldSendEmail = true;
        emailType = "second";
      } else if (!emailTypes.includes("third") && abandonedAt <= thirdEmailThreshold) {
        shouldSendEmail = true;
        emailType = "third";
      }

      if (shouldSendEmail && cart.customer_email) {
        console.log(`Sending ${emailType} email to ${cart.customer_email} for cart ${cart.id}`);
        
        const emailContent = await generateEmailContent(cart, emailType);
        
        if (!emailContent) {
          console.error(`No email template found for type: ${emailType}`);
          continue;
        }
        
        try {
          const emailResponse = await resend.emails.send({
            from: "Fit Food Tasty <orders@fitfoodtasty.com>",
            to: [cart.customer_email],
            subject: emailContent.subject,
            html: emailContent.html,
          });

          console.log("Email sent successfully:", emailResponse);

          // Log the email
          await supabase.from("abandoned_cart_emails").insert({
            abandoned_cart_id: cart.id,
            email_type: emailType,
            email_subject: emailContent.subject,
            email_content: emailContent.html,
          });

        } catch (emailError) {
          console.error(`Failed to send ${emailType} email:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Abandoned cart recovery process completed",
        processed: abandonedCarts?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in abandoned cart recovery:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function generateEmailContent(cart: AbandonedCart, emailType: string) {
  try {
    // Fetch email template from database
    const { data: template, error } = await supabase
      .from("abandoned_cart_email_templates")
      .select("subject, html_content")
      .eq("email_type", emailType)
      .single();

    if (error || !template) {
      console.error("Error fetching email template:", error);
      return null;
    }

    // Generate cart items HTML
    const cartItemsHtml = cart.cart_items.map((item: any) => `
      <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
        <strong>${item.name || item.meal_name}</strong><br>
        Quantity: ${item.quantity}<br>
        Price: £${(item.price || item.unit_price || 0).toFixed(2)}
      </div>
    `).join("");

    // Replace template variables
    let htmlContent = template.html_content
      .replace(/\{\{customer_name\}\}/g, cart.customer_name || "there")
      .replace(/\{\{cart_items\}\}/g, cartItemsHtml)
      .replace(/\{\{total_amount\}\}/g, cart.total_amount.toFixed(2));

    return {
      subject: template.subject,
      html: htmlContent
    };
  } catch (error) {
    console.error("Error generating email content:", error);
    return null;
  }
}

serve(handler);