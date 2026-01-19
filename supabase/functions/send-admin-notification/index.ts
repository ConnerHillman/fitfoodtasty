import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email recipient
const ADMIN_EMAIL = "conner@fitfoodtasty.co.uk";
const FROM_EMAIL = "Fit Food Tasty <orders@orders.fitfoodtasty.co.uk>";

// Logo URL from Supabase storage
const LOGO_URL = "https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/fit-food-tasty-logo.png";

type NotificationType = 
  | "new_order" 
  | "payment_failed" 
  | "subscription_started" 
  | "subscription_cancelled";

interface NotificationData {
  type: NotificationType;
  // New Order fields
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount?: number;
  itemCount?: number;
  deliveryDate?: string;
  deliveryAddress?: string;
  orderNotes?: string;
  orderType?: string;
  // Payment Failed fields
  paymentIntentId?: string;
  failureReason?: string;
  amount?: number;
  // Subscription fields
  subscriptionId?: string;
  planName?: string;
  cancellationReason?: string;
}

// Color scheme per notification type
const colorSchemes: Record<NotificationType, { header: string; emoji: string; title: string }> = {
  new_order: { header: "#22c55e", emoji: "🛒", title: "New Order Received" },
  payment_failed: { header: "#ef4444", emoji: "⚠️", title: "Payment Failed" },
  subscription_started: { header: "#3b82f6", emoji: "🎉", title: "New Subscriber" },
  subscription_cancelled: { header: "#f59e0b", emoji: "📋", title: "Subscription Cancelled" },
};

function generateEmailHtml(data: NotificationData): string {
  const scheme = colorSchemes[data.type];
  const timestamp = new Date().toLocaleString("en-GB", { 
    timeZone: "Europe/London",
    dateStyle: "full",
    timeStyle: "short"
  });

  let contentHtml = "";

  switch (data.type) {
    case "new_order":
      contentHtml = `
        <tr>
          <td style="padding: 24px;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">
              Order #${data.orderNumber || data.orderId?.substring(0, 8).toUpperCase()}
            </h2>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td>
                      <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 600;">
                        ${data.customerName || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                      <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                        <a href="mailto:${data.customerEmail}" style="color: #22c55e; text-decoration: none;">${data.customerEmail || "N/A"}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total</td>
                      <td style="padding: 8px 0; color: #22c55e; font-size: 18px; text-align: right; font-weight: 700;">
                        £${data.totalAmount?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Items</td>
                      <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                        ${data.itemCount || 0} meal${(data.itemCount || 0) !== 1 ? "s" : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type</td>
                      <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; text-transform: capitalize;">
                        ${data.orderType || "individual"}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Delivery Date</td>
                      <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                        ${data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "Not set"}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            ${data.deliveryAddress ? `
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #166534; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</p>
              <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px;">${data.deliveryAddress}</p>
            </div>
            ` : ""}
            
            ${data.orderNotes ? `
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Customer Notes</p>
              <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px;">${data.orderNotes}</p>
            </div>
            ` : ""}
            
            <a href="https://fitfoodtasty.lovable.app/admin/orders/${data.orderId}" 
               style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Order in Admin
            </a>
          </td>
        </tr>
      `;
      break;

    case "payment_failed":
      contentHtml = `
        <tr>
          <td style="padding: 24px;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; color: #991b1b; font-size: 18px;">
                Payment Attempt Failed
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td>
                  <td style="padding: 8px 0; color: #ef4444; font-size: 18px; text-align: right; font-weight: 700;">
                    £${((data.amount || 0) / 100).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer Email</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                    ${data.customerEmail || "Unknown"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Failure Reason</td>
                  <td style="padding: 8px 0; color: #991b1b; font-size: 14px; text-align: right;">
                    ${data.failureReason || "Unknown reason"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Intent</td>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 12px; text-align: right; font-family: monospace;">
                    ${data.paymentIntentId || "N/A"}
                  </td>
                </tr>
              </table>
            </div>
            
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              The customer may retry their payment. No action required unless this becomes a recurring issue.
            </p>
          </td>
        </tr>
      `;
      break;

    case "subscription_started":
      contentHtml = `
        <tr>
          <td style="padding: 24px;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px;">
                New Subscriber!
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 600;">
                    ${data.customerName || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                    <a href="mailto:${data.customerEmail}" style="color: #3b82f6; text-decoration: none;">${data.customerEmail || "N/A"}</a>
                  </td>
                </tr>
                ${data.planName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                    ${data.planName}
                  </td>
                </tr>
                ` : ""}
                ${data.deliveryDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">First Delivery</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                    ${new Date(data.deliveryDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </td>
                </tr>
                ` : ""}
              </table>
            </div>
            
            <a href="https://fitfoodtasty.lovable.app/admin?tab=subscriptions" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Subscriptions
            </a>
          </td>
        </tr>
      `;
      break;

    case "subscription_cancelled":
      contentHtml = `
        <tr>
          <td style="padding: 24px;">
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; color: #92400e; font-size: 18px;">
                Subscription Cancelled
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 600;">
                    ${data.customerName || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                    <a href="mailto:${data.customerEmail}" style="color: #f59e0b; text-decoration: none;">${data.customerEmail || "N/A"}</a>
                  </td>
                </tr>
                ${data.cancellationReason ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reason</td>
                  <td style="padding: 8px 0; color: #92400e; font-size: 14px; text-align: right;">
                    ${data.cancellationReason}
                  </td>
                </tr>
                ` : ""}
              </table>
            </div>
            
            <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
              Consider reaching out to understand why they cancelled and if there's anything that could bring them back.
            </p>
            
            <a href="https://fitfoodtasty.lovable.app/admin?tab=subscriptions" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Subscriptions
            </a>
          </td>
        </tr>
      `;
      break;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scheme.emoji} ${scheme.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <img src="${LOGO_URL}" alt="Fit Food Tasty" style="height: 50px; width: auto;">
            </td>
          </tr>
          
          <!-- Colored Banner -->
          <tr>
            <td style="background-color: ${scheme.header}; padding: 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${scheme.emoji} ${scheme.title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          ${contentHtml}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Fit Food Tasty • Automated Admin Alert
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px;">
                ${timestamp}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getSubjectLine(data: NotificationData): string {
  const scheme = colorSchemes[data.type];
  
  switch (data.type) {
    case "new_order":
      return `${scheme.emoji} New Order #${data.orderNumber || data.orderId?.substring(0, 8).toUpperCase()} - £${data.totalAmount?.toFixed(2) || "0.00"}`;
    case "payment_failed":
      return `${scheme.emoji} Payment Failed - £${((data.amount || 0) / 100).toFixed(2)}`;
    case "subscription_started":
      return `${scheme.emoji} New Subscriber - ${data.customerEmail || "Unknown"}`;
    case "subscription_cancelled":
      return `${scheme.emoji} Subscription Cancelled - ${data.customerEmail || "Unknown"}`;
    default:
      return `${scheme.emoji} ${scheme.title}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationData = await req.json();
    
    console.log("[send-admin-notification] Sending notification:", {
      type: data.type,
      orderId: data.orderId,
      customerEmail: data.customerEmail,
      timestamp: new Date().toISOString()
    });

    const subject = getSubjectLine(data);
    const htmlContent = generateEmailHtml(data);

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent,
    });

    console.log("[send-admin-notification] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.id,
        recipient: ADMIN_EMAIL 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[send-admin-notification] Error:", message);
    
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
