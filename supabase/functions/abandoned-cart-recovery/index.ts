import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";
import Handlebars from "npm:handlebars@4.7.8";

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

interface CartItem {
  name?: string;
  meal_name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  variant?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[abandoned-cart-recovery] Starting recovery process...");

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
      console.log("[abandoned-cart-recovery] Emails are disabled");
      return new Response(JSON.stringify({ message: "Emails disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[abandoned-cart-recovery] Email settings:", { firstEmailDelay, secondEmailDelay, thirdEmailDelay });

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
      console.error("[abandoned-cart-recovery] Error fetching abandoned carts:", cartsError);
      throw cartsError;
    }

    console.log(`[abandoned-cart-recovery] Found ${abandonedCarts?.length || 0} abandoned carts`);

    let emailsSent = 0;

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
        console.log(`[abandoned-cart-recovery] Sending ${emailType} email to ${cart.customer_email} for cart ${cart.id}`);
        
        const emailContent = await generateEmailContent(cart, emailType);
        
        if (!emailContent) {
          console.error(`[abandoned-cart-recovery] No email template found for type: ${emailType}`);
          continue;
        }
        
        try {
          const emailResponse = await resend.emails.send({
            from: "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>",
            to: [cart.customer_email],
            subject: emailContent.subject,
            html: emailContent.html,
          });

          console.log("[abandoned-cart-recovery] Email sent successfully:", emailResponse);

          // Log the email
          await supabase.from("abandoned_cart_emails").insert({
            abandoned_cart_id: cart.id,
            email_type: emailType,
            email_subject: emailContent.subject,
            email_content: emailContent.html,
          });

          emailsSent++;

        } catch (emailError) {
          console.error(`[abandoned-cart-recovery] Failed to send ${emailType} email:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Abandoned cart recovery process completed",
        processed: abandonedCarts?.length || 0,
        emailsSent
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[abandoned-cart-recovery] Error:", error);
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
      console.error("[abandoned-cart-recovery] Error fetching email template:", error);
      return null;
    }

    // Build cart items array with proper structure for Handlebars
    const cartItems = (cart.cart_items || []).map((item: CartItem) => {
      const itemName = item.name || item.meal_name || 'Item';
      const quantity = item.quantity || 1;
      const unitPrice = item.price || item.unit_price || 0;
      const lineTotal = (quantity * unitPrice).toFixed(2);
      
      return {
        item_name: itemName,
        quantity: quantity,
        line_total: lineTotal,
        variant: item.variant || null
      };
    });

    // Calculate totals
    const hasCartItems = cartItems.length > 0;
    const cartTotal = cart.total_amount > 0 ? cart.total_amount.toFixed(2) : null;
    
    // Build recovery URL - use cart session if available
    const baseUrl = "https://fitfoodtasty.co.uk";
    const checkoutUrl = cart.session_id 
      ? `${baseUrl}/cart?recover=${cart.session_id}`
      : `${baseUrl}/cart`;

    // Build template context with safe fallbacks
    const templateContext = {
      // Customer info with fallback
      customer_name: cart.customer_name?.trim() || null,
      has_customer_name: Boolean(cart.customer_name?.trim()),
      
      // Cart items
      cart_items: hasCartItems ? cartItems : null,
      has_cart_items: hasCartItems,
      
      // Totals - only include if we have a value
      cart_total: cartTotal,
      has_cart_total: Boolean(cartTotal),
      
      // URLs
      checkout_url: checkoutUrl,
      menu_url: `${baseUrl}/menu`,
      website_url: baseUrl,
      
      // Business info
      business_name: "Fit Food Tasty",
      support_email: "info@fitfoodtasty.co.uk",
      
      // Year for copyright
      current_year: new Date().getFullYear(),
    };

    console.log("[abandoned-cart-recovery] Template context:", {
      hasCustomerName: templateContext.has_customer_name,
      hasCartItems: templateContext.has_cart_items,
      hasCartTotal: templateContext.has_cart_total,
      itemCount: cartItems.length,
      checkoutUrl: templateContext.checkout_url
    });

    // Compile and render with Handlebars
    const compiledSubject = Handlebars.compile(template.subject);
    const compiledHtml = Handlebars.compile(template.html_content);

    const renderedSubject = compiledSubject(templateContext);
    const renderedHtml = compiledHtml(templateContext);

    return {
      subject: renderedSubject,
      html: renderedHtml
    };
  } catch (error) {
    console.error("[abandoned-cart-recovery] Error generating email content:", error);
    return null;
  }
}

serve(handler);
