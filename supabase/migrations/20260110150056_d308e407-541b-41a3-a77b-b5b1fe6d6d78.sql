-- Restore the professional order confirmation email template with logo and correct variable names
UPDATE order_email_templates
SET 
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px 40px 20px 40px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png" alt="Fit Food Tasty" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          
          <!-- Success Banner -->
          <tr>
            <td align="center" style="padding: 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px;">
                <tr>
                  <td align="center" style="padding: 30px 20px;">
                    <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-block; line-height: 60px; margin-bottom: 15px;">
                      <span style="color: #ffffff; font-size: 30px;">✓</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">Order Confirmed!</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Thank you for your order, {{customer_name}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #166534; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Order Details</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600; width: 140px;">Order Number:</td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px;">#{{order_id}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600;">Order Date:</td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px;">{{order_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600;">{{delivery_method}} Date:</td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px;">{{delivery_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; font-weight: 600; vertical-align: top;">{{delivery_method}} Address:</td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px;">{{delivery_address}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Items -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">Your Order</h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #166534;">
                  <td style="padding: 12px 15px; color: #ffffff; font-size: 13px; font-weight: 600;">Item</td>
                  <td style="padding: 12px 10px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: center; width: 70px;">Price</td>
                  <td style="padding: 12px 10px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: center; width: 50px;">Qty</td>
                  <td style="padding: 12px 15px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: right; width: 80px;">Total</td>
                </tr>
                {{#each order_items}}
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 15px; color: #374151; font-size: 14px;">{{this.meal_name}}</td>
                  <td style="padding: 15px 10px; color: #6b7280; font-size: 14px; text-align: center;">£{{this.unit_price}}</td>
                  <td style="padding: 15px 10px; color: #6b7280; font-size: 14px; text-align: center;">{{this.quantity}}</td>
                  <td style="padding: 15px; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">£{{this.total_price}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Totals -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                        <td style="padding: 5px 0; color: #374151; font-size: 14px; text-align: right;">£{{subtotal}}</td>
                      </tr>
                      {{#if has_discount}}
                      <tr>
                        <td style="padding: 5px 0; color: #22c55e; font-size: 14px;">Discount:</td>
                        <td style="padding: 5px 0; color: #22c55e; font-size: 14px; text-align: right;">-£{{discount_amount}}</td>
                      </tr>
                      {{/if}}
                      {{#if has_delivery_fee}}
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">{{delivery_method}} Fee:</td>
                        <td style="padding: 5px 0; color: #374151; font-size: 14px; text-align: right;">£{{delivery_fee}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td colspan="2" style="padding: 15px 0 0 0; border-top: 2px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #166534; font-size: 18px; font-weight: 700;">Total Paid:</td>
                        <td style="padding: 5px 0; color: #166534; font-size: 18px; font-weight: 700; text-align: right;">£{{total_amount}}</td>
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
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #92400e; font-size: 13px; font-weight: 600; margin: 0 0 5px 0;">📝 Order Notes:</p>
                    <p style="color: #a16207; font-size: 14px; margin: 0;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="color: #166534; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Thank you for choosing Fit Food Tasty!</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0;">If you have any questions, please contact us</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0;">{{business_address}} | {{business_phone}}</p>
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
  updated_at = NOW()
WHERE template_type = 'order_confirmation' AND is_active = true;