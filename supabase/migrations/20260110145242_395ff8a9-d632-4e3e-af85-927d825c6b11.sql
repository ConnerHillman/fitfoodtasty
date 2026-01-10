-- Consolidate customer details into the green order details box
UPDATE order_email_templates
SET 
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">{{business_name}}</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #666;">Premium Meal Preparation</p>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- Success Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">✓</span>
                    </div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">Order Confirmed!</h2>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Thank you for your order, {{customer_name}}</p>
                  </td>
                </tr>
                
                <!-- Order Details Box (Consolidated) -->
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: #E8F5E9; border-radius: 12px; padding: 20px;">
                      <tr>
                        <td style="padding: 20px;">
                          <!-- Order Info Section -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666;">Order Number:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 600; text-align: right;">#{{order_number}}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666;">Order Date:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">{{order_date}}</td>
                            </tr>
                          </table>
                          
                          <!-- Divider -->
                          <div style="height: 1px; background: rgba(0,0,0,0.1); margin: 12px 0;"></div>
                          
                          <!-- Customer Info Section -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666;">Customer:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 600; text-align: right;">{{customer_name}}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666;">Email:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">{{customer_email}}</td>
                            </tr>
                            {{#if has_customer_phone}}
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666;">Phone:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">{{customer_phone}}</td>
                            </tr>
                            {{/if}}
                          </table>
                          
                          <!-- Divider -->
                          <div style="height: 1px; background: rgba(0,0,0,0.1); margin: 12px 0;"></div>
                          
                          <!-- Delivery Info Section -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                            {{#if has_delivery_date}}
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666;">Delivery Date:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 600; text-align: right;">{{delivery_date}}</td>
                            </tr>
                            {{/if}}
                            {{#if has_delivery_address}}
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #666; vertical-align: top;">Delivery Address:</td>
                              <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">{{delivery_address}}</td>
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
                  <td style="padding: 0 24px 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1a1a1a;">Your Order</h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      {{#each items}}
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                          <span style="font-size: 14px; color: #1a1a1a;">{{this.name}}</span>
                          <span style="font-size: 14px; color: #666;"> × {{this.quantity}}</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
                          <span style="font-size: 14px; color: #1a1a1a;">{{this.formatted_total}}</span>
                        </td>
                      </tr>
                      {{/each}}
                    </table>
                  </td>
                </tr>
                
                <!-- Totals -->
                <tr>
                  <td style="padding: 0 24px 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 8px; padding: 16px;">
                      <tr>
                        <td style="padding: 16px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #666;">Subtotal:</td>
                              <td style="padding: 4px 0; font-size: 14px; color: #1a1a1a; text-align: right;">{{subtotal}}</td>
                            </tr>
                            {{#if has_discount}}
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #22c55e;">Discount:</td>
                              <td style="padding: 4px 0; font-size: 14px; color: #22c55e; text-align: right;">-{{discount}}</td>
                            </tr>
                            {{/if}}
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #666;">Delivery:</td>
                              <td style="padding: 4px 0; font-size: 14px; color: #1a1a1a; text-align: right;">{{delivery_fee}}</td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0 0; font-size: 18px; font-weight: 700; color: #1a1a1a; border-top: 2px solid #e5e7eb; margin-top: 8px;">Total:</td>
                              <td style="padding: 12px 0 0; font-size: 18px; font-weight: 700; color: #22c55e; text-align: right; border-top: 2px solid #e5e7eb;">{{total}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #666;">Questions about your order?</p>
                    <a href="mailto:{{business_email}}" style="font-size: 14px; color: #22c55e; text-decoration: none;">{{business_email}}</a>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer Text -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">© {{current_year}} {{business_name}}. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  text_content = 'ORDER CONFIRMED

Thank you for your order, {{customer_name}}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER DETAILS
Order Number: #{{order_number}}
Order Date: {{order_date}}

CUSTOMER DETAILS
Name: {{customer_name}}
Email: {{customer_email}}
{{#if has_customer_phone}}Phone: {{customer_phone}}{{/if}}

{{#if has_delivery_date}}DELIVERY INFORMATION
Delivery Date: {{delivery_date}}{{/if}}
{{#if has_delivery_address}}Delivery Address: {{delivery_address}}{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR ORDER
{{#each items}}
{{this.name}} × {{this.quantity}} - {{this.formatted_total}}
{{/each}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: {{subtotal}}
{{#if has_discount}}Discount: -{{discount}}{{/if}}
Delivery: {{delivery_fee}}
TOTAL: {{total}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Contact us at {{business_email}}

© {{current_year}} {{business_name}}',
  updated_at = now()
WHERE id = '77921591-dee2-4a08-b913-2df1f5ff381d';