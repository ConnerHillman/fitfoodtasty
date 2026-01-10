-- Update the order confirmation email template with customer details and reduced whitespace
UPDATE public.order_email_templates
SET 
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header - Reduced padding -->
          <tr>
            <td align="center" style="padding: 20px 40px 10px 40px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png" alt="Fit Food Tasty" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          
          <!-- Success Banner - Reduced padding -->
          <tr>
            <td style="padding: 10px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #dcfce7; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 20px 20px;">
                    <div style="width: 50px; height: 50px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 28px; line-height: 50px;">✓</span>
                    </div>
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold; color: #166534;">Order Confirmed!</h1>
                    <p style="margin: 0; font-size: 16px; color: #15803d;">Thank you for your order, {{customer_name}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 10px 40px 20px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #166534; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Order Details</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600; width: 140px;">Customer Name:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{customer_name}}</td>
                      </tr>
                      {{#if has_customer_phone}}
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">Phone:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{customer_phone}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">Order Number:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px; font-weight: bold;">#{{order_id}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">Order Date:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{order_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">{{delivery_method}} Date:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{delivery_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">{{delivery_method}} Address:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{delivery_address}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Items Table -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #333;">Your Order</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #22c55e;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 13px; font-weight: 600; color: #ffffff;">Item</th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 600; color: #ffffff;">Price</th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 600; color: #ffffff;">Qty</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 13px; font-weight: 600; color: #ffffff;">Total</th>
                </tr>
                {{#each order_items}}
                <tr style="background-color: {{#if @odd}}#f9fafb{{else}}#ffffff{{/if}};">
                  <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">{{this.meal_name}}</td>
                  <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #374151;">£{{this.unit_price}}</td>
                  <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #374151;">{{this.quantity}}</td>
                  <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151; font-weight: 500;">£{{this.total_price}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Totals Section -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                <tr>
                  <td style="padding: 15px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;">Subtotal:</td>
                        <td style="padding: 5px 0; font-size: 14px; color: #374151; text-align: right;">£{{subtotal}}</td>
                      </tr>
                      {{#if has_discount}}
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #22c55e;">Discount:</td>
                        <td style="padding: 5px 0; font-size: 14px; color: #22c55e; text-align: right;">-£{{discount_amount}}</td>
                      </tr>
                      {{/if}}
                      {{#if has_delivery_fee}}
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #6b7280;">Delivery Fee:</td>
                        <td style="padding: 5px 0; font-size: 14px; color: #374151; text-align: right;">£{{delivery_fee}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 12px 0 5px 0; font-size: 18px; font-weight: bold; color: #166534; border-top: 2px solid #e5e7eb;">Total Paid:</td>
                        <td style="padding: 12px 0 5px 0; font-size: 18px; font-weight: bold; color: #166534; text-align: right; border-top: 2px solid #e5e7eb;">£{{total_amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          {{#if has_order_notes}}
          <!-- Order Notes -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 15px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #92400e;">Order Notes:</h3>
                    <p style="margin: 0; font-size: 14px; color: #78350f;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #22c55e;">Thank you for choosing Fit Food Tasty!</p>
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280;">{{business_address}}</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">Phone: {{business_phone}}</p>
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
  updated_at = now()
WHERE template_type = 'order_confirmation' AND is_default = true;