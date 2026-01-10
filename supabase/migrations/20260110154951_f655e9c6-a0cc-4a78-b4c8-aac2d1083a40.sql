-- Restore the previous email template with both buttons side by side
UPDATE order_email_templates
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <img src="https://fitfoodtasty.co.uk/lovable-uploads/a4f5ea12-e388-48b6-abc3-4e7e0ec80763.png" alt="Fit Food Tasty" width="180" style="display: block; max-width: 180px; height: auto;">
            </td>
          </tr>
          
          <!-- Success Banner -->
          <tr>
            <td style="padding: 0 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 25px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thank you for your order, {{customer_name}}!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="color: #166534; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Order Details</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Order Number:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; text-align: right;">
                          {{order_number}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Delivery Date:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; text-align: right;">
                          {{delivery_date}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>Delivery Address:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; text-align: right;">
                          {{delivery_address}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Items -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background-color: #166534; padding: 15px 20px;">
                    <h3 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600;">Your Meals</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #ffffff;">
                    {{order_items_html}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Totals -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{subtotal}}</td>
                      </tr>
                      {{#if discount_amount}}
                      <tr>
                        <td style="padding: 8px 0; color: #22c55e; font-size: 14px;">Discount:</td>
                        <td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right;">-{{discount_amount}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Delivery:</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{delivery_fee}}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 10px;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #111827; font-size: 18px; font-weight: 700;">Total:</td>
                        <td style="padding: 8px 0; color: #22c55e; font-size: 18px; font-weight: 700; text-align: right;">{{order_total}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Action Buttons - Side by Side -->
          <tr>
            <td align="center" style="padding: 0 20px 30px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 8px;">
                    <a href="https://fitfoodtasty.co.uk/orders" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; white-space: nowrap;">View Your Orders</a>
                  </td>
                  <td style="padding-left: 8px;">
                    <a href="{{reorder_url}}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; white-space: nowrap;">Reorder This Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 30px 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px;">
                Questions? Reply to this email or contact us at<br>
                <a href="mailto:hello@fitfoodtasty.co.uk" style="color: #22c55e; text-decoration: none;">hello@fitfoodtasty.co.uk</a>
              </p>
              <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 12px;">
                Follow us on Instagram<br>
                <a href="https://instagram.com/fitfoodtasty" style="color: #22c55e; text-decoration: none;">@fitfoodtasty</a>
              </p>
              <p style="color: #4b5563; margin: 0; font-size: 11px;">
                © 2024 Fit Food Tasty. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
updated_at = now()
WHERE id = '428d1c09-3b17-404a-af37-830b4aff27f1';