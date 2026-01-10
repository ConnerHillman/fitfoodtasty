
-- Fix Order Confirmed text visibility and add Customer Email
UPDATE public.order_email_templates
SET 
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 30px 20px 20px 20px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png" alt="Fit Food Tasty" style="max-width: 200px; height: auto; display: block;">
            </td>
          </tr>
          
          <!-- Success Banner -->
          <tr>
            <td align="center" style="padding: 0 20px 20px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #22c55e; border-radius: 12px;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="width: 50px; height: 50px; background-color: rgba(255,255,255,0.2); border-radius: 50%; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 28px; line-height: 50px;">✓</span>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 15px 0 5px 0; font-family: Arial, Helvetica, sans-serif;">Order Confirmed!</p>
                    <p style="color: #ffffff; font-size: 16px; margin: 0; opacity: 0.9;">Thank you for your order, {{customer_name}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #166534; font-size: 18px; font-weight: bold; margin: 0 0 15px 0; border-bottom: 1px solid #bbf7d0; padding-bottom: 10px;">Order Details</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold; width: 140px;">Customer Name:</td>
                        <td style="padding: 8px 0; color: #15803d;">{{customer_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold;">Email:</td>
                        <td style="padding: 8px 0; color: #15803d;">{{customer_email}}</td>
                      </tr>
                      {{#if has_customer_phone}}
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold;">Phone:</td>
                        <td style="padding: 8px 0; color: #15803d;">{{customer_phone}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold;">Order Number:</td>
                        <td style="padding: 8px 0; color: #15803d; font-weight: bold;">#{{order_id}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold;">Order Date:</td>
                        <td style="padding: 8px 0; color: #15803d;">{{order_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold;">Delivery Date:</td>
                        <td style="padding: 8px 0; color: #15803d;">{{delivery_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-weight: bold;">Delivery Address:</td>
                        <td style="padding: 8px 0; color: #15803d;">{{delivery_address}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Items Section -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">Your Order</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <!-- Table Header -->
                <tr>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 15px; font-weight: bold; font-size: 14px;">Item</td>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 10px; font-weight: bold; font-size: 14px; text-align: center; width: 70px;">Price</td>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 10px; font-weight: bold; font-size: 14px; text-align: center; width: 50px;">Qty</td>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 15px; font-weight: bold; font-size: 14px; text-align: right; width: 80px;">Total</td>
                </tr>
                <!-- Order Items -->
                {{#each order_items}}
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #374151;">{{meal_name}}</td>
                  <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; text-align: center;">£{{unit_price}}</td>
                  <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; text-align: center;">{{quantity}}</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right; font-weight: 600;">£{{total_price}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Totals Section -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280;">Subtotal:</td>
                        <td style="padding: 5px 0; color: #374151; text-align: right;">£{{subtotal}}</td>
                      </tr>
                      {{#if has_discount}}
                      <tr>
                        <td style="padding: 5px 0; color: #dc2626;">Discount:</td>
                        <td style="padding: 5px 0; color: #dc2626; text-align: right;">-£{{discount_amount}}</td>
                      </tr>
                      {{/if}}
                      {{#if has_delivery_fee}}
                      <tr>
                        <td style="padding: 5px 0; color: #6b7280;">Delivery Fee:</td>
                        <td style="padding: 5px 0; color: #374151; text-align: right;">£{{delivery_fee}}</td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td colspan="2" style="padding: 10px 0 5px 0; border-top: 2px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #166534; font-size: 18px; font-weight: bold;">Total Paid:</td>
                        <td style="padding: 5px 0; color: #166534; font-size: 18px; font-weight: bold; text-align: right;">£{{total_amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- View Order Button -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <a href="https://fitfoodtasty.co.uk/orders" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View Your Orders</a>
            </td>
          </tr>
          
          <!-- Order Notes -->
          {{#if has_order_notes}}
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef9c3; border: 1px solid #fde047; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #854d0e; font-weight: bold; margin: 0 0 5px 0;">📝 Order Notes:</p>
                    <p style="color: #a16207; margin: 0;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; background-color: #f3f4f6; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="color: #166534; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Thank you for choosing Fit Food Tasty!</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">Fresh, healthy meals delivered to your door.</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0;">📧 orders@fitfoodtasty.co.uk</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 15px 0;">🌐 www.fitfoodtasty.co.uk</p>
                    <p style="margin: 0;">
                      <a href="https://www.instagram.com/fitfoodtasty/" style="color: #22c55e; text-decoration: none; font-size: 14px;">📸 Follow us on Instagram</a>
                    </p>
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
WHERE id = '428d1c09-3b17-404a-af37-830b4aff27f1';
