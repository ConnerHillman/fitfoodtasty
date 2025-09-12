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
        
        const emailContent = generateEmailContent(cart, emailType);
        
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

function generateEmailContent(cart: AbandonedCart, emailType: string) {
  const cartItemsHtml = cart.cart_items.map((item: any) => `
    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
      <strong>${item.name || item.meal_name}</strong><br>
      Quantity: ${item.quantity}<br>
      Price: £${(item.price || item.unit_price || 0).toFixed(2)}
    </div>
  `).join("");

  const templates = {
    first: {
      subject: "Don't forget your delicious meals! 🍽️",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${cart.customer_name || "there"},</h2>
          <p>You left some amazing meals in your cart! Don't miss out on these delicious, healthy options.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Cart:</h3>
            ${cartItemsHtml}
            <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
              Total: £${cart.total_amount.toFixed(2)}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fitfoodtasty.com/cart" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Complete Your Order
            </a>
          </div>
          
          <p>Your healthy lifestyle is just one click away!</p>
          <p>Best regards,<br>The Fit Food Tasty Team</p>
        </div>
      `
    },
    second: {
      subject: "Still thinking about those meals? 🤔",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${cart.customer_name || "there"},</h2>
          <p>We noticed you're still considering your meal selection. Here's what you had in mind:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Saved Cart:</h3>
            ${cartItemsHtml}
            <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
              Total: £${cart.total_amount.toFixed(2)}
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>💡 Why Choose Fit Food Tasty?</h4>
            <ul>
              <li>Fresh, healthy ingredients</li>
              <li>Nutritionally balanced meals</li>
              <li>Convenient delivery</li>
              <li>No meal prep required</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fitfoodtasty.com/cart" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Complete Your Order Now
            </a>
          </div>
          
          <p>Questions? Just reply to this email - we're here to help!</p>
          <p>Best regards,<br>The Fit Food Tasty Team</p>
        </div>
      `
    },
    third: {
      subject: "Last chance: Your meals are waiting! ⏰",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${cart.customer_name || "there"},</h2>
          <p>This is our final reminder about the delicious meals waiting in your cart.</p>
          
          <div style="background: #fee2e2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>⚠️ Cart Expiring Soon</h3>
            <p>Your selected meals will be removed from your cart soon. Don't miss out!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Cart:</h3>
            ${cartItemsHtml}
            <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
              Total: £${cart.total_amount.toFixed(2)}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://fitfoodtasty.com/cart" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Save My Cart - Order Now
            </a>
          </div>
          
          <p>After this, you'll need to add the meals to your cart again.</p>
          <p>Thank you for considering Fit Food Tasty!</p>
          <p>Best regards,<br>The Fit Food Tasty Team</p>
        </div>
      `
    }
  };

  return templates[emailType as keyof typeof templates];
}

serve(handler);