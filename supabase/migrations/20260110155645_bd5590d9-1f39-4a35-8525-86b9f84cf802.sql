-- Restore the complete working email template with correct variable names and side-by-side buttons
UPDATE order_email_templates
SET 
  html_content = '<!DOCTYPE html>
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
              <img src="https://fitfoodtasty.co.uk/lovable-uploads/a4f5ea12-e388-48b6-abc3-4e7e0ec80763.png" alt="Fit Food Tasty" width="180" style="display: block;">
            </td>
          </tr>
          
          <!-- Success Banner -->
          <tr>
            <td style="padding: 0 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px 20px; border-radius: 12px;">
                    <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 60px; text-align: center;">
                      <span style="color: #ffffff; font-size: 30px;">✓</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Order Confirmed!</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Thank you for your order, {{customer_name}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 25px 20px 15px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Order Details</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;"><strong>Order Number:</strong></td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right;">#{{order_id}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;"><strong>Customer:</strong></td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right;">{{customer_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;"><strong>Email:</strong></td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right;">{{customer_email}}</td>
                      </tr>
                      {{#if requested_delivery_date}}
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;"><strong>Delivery Date:</strong></td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right;">{{requested_delivery_date}}</td>
                      </tr>
                      {{/if}}
                      {{#if delivery_address}}
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;"><strong>Delivery Address:</strong></td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right;">{{delivery_address}}</td>
                      </tr>
                      {{/if}}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Items -->
          <tr>
            <td style="padding: 15px 20px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Your Order</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <!-- Table Header -->
                <tr style="background-color: #22c55e;">
                  <td style="padding: 12px 15px; color: #ffffff; font-weight: 600; font-size: 14px;">Item</td>
                  <td style="padding: 12px 10px; color: #ffffff; font-weight: 600; font-size: 14px; text-align: center;">Price</td>
                  <td style="padding: 12px 10px; color: #ffffff; font-weight: 600; font-size: 14px; text-align: center;">Qty</td>
                  <td style="padding: 12px 15px; color: #ffffff; font-weight: 600; font-size: 14px; text-align: right;">Total</td>
                </tr>
                <!-- Order Items Loop -->
                {{#each order_items}}
                <tr style="background-color: {{#if @odd}}#f9fafb{{else}}#ffffff{{/if}};">
                  <td style="padding: 14px 15px; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{{this.meal_name}}</td>
                  <td style="padding: 14px 10px; color: #6b7280; font-size: 14px; text-align: center; border-bottom: 1px solid #e5e7eb;">£{{this.unit_price}}</td>
                  <td style="padding: 14px 10px; color: #6b7280; font-size: 14px; text-align: center; border-bottom: 1px solid #e5e7eb;">{{this.quantity}}</td>
                  <td style="padding: 14px 15px; color: #374151; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e5e7eb;">£{{this.total_price}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Totals Section -->
          <tr>
            <td style="padding: 15px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 14px; text-align: right;">£{{subtotal}}</td>
                      </tr>
                      {{#if discount_amount}}
                      <tr>
                        <td style="padding: 6px 0; color: #22c55e; font-size: 14px;">Discount</td>
                        <td style="padding: 6px 0; color: #22c55e; font-size: 14px; text-align: right;">-£{{discount_amount}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Delivery</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 14px; text-align: right;">{{#if delivery_fee}}£{{delivery_fee}}{{else}}Free{{/if}}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 12px 0 0 0; border-top: 2px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #1f2937; font-size: 18px; font-weight: 700;">Total</td>
                        <td style="padding: 6px 0; color: #22c55e; font-size: 18px; font-weight: 700; text-align: right;">£{{total_amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Action Buttons - Side by Side -->
          <tr>
            <td align="center" style="padding: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://fitfoodtasty.co.uk/orders" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Your Orders</a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="{{reorder_url}}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reorder This Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Notes (if present) -->
          {{#if order_notes}}
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 12px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">📝 Order Notes</p>
                    <p style="color: #a16207; font-size: 14px; margin: 0;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px 20px; border-radius: 0 0 16px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Questions about your order?</p>
                    <p style="color: #ffffff; font-size: 14px; margin: 0 0 20px 0;">
                      <a href="mailto:info@fitfoodtasty.co.uk" style="color: #22c55e; text-decoration: none;">info@fitfoodtasty.co.uk</a>
                    </p>
                    <p style="margin: 0 0 15px 0;">
                      <a href="https://instagram.com/fitfoodtasty" style="color: #22c55e; text-decoration: none; font-size: 14px;">Follow us on Instagram @fitfoodtasty</a>
                    </p>
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 Fit Food Tasty. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  subject_template = 'Order Confirmed - #{{order_id}}',
  text_content = 'Order Confirmed!

Thank you for your order, {{customer_name}}!

Order Number: #{{order_id}}
Customer: {{customer_name}}
Email: {{customer_email}}
{{#if requested_delivery_date}}Delivery Date: {{requested_delivery_date}}{{/if}}
{{#if delivery_address}}Delivery Address: {{delivery_address}}{{/if}}

Your Order:
{{#each order_items}}
- {{this.meal_name}} x{{this.quantity}} - £{{this.total_price}}
{{/each}}

Subtotal: £{{subtotal}}
{{#if discount_amount}}Discount: -£{{discount_amount}}{{/if}}
Delivery: {{#if delivery_fee}}£{{delivery_fee}}{{else}}Free{{/if}}
Total: £{{total_amount}}

{{#if order_notes}}Order Notes: {{order_notes}}{{/if}}

View your orders: https://fitfoodtasty.co.uk/orders
Reorder this order: {{reorder_url}}

Questions? Contact us at info@fitfoodtasty.co.uk

© 2025 Fit Food Tasty. All rights reserved.',
  updated_at = now()
WHERE template_type = 'order_confirmation' AND is_default = true;