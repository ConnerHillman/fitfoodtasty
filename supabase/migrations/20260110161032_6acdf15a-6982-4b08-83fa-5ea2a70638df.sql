-- Restore the original working Grok email template with fixes
-- This restores the exact template from 20260110152842 with:
-- 1. Correct Supabase-hosted logo URL
-- 2. Solid green background (no gradients - not supported in email)
-- 3. Correct variable names
-- 4. Added side-by-side "View Your Orders" and "Reorder This Order" buttons

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
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png" alt="Fit Food Tasty" width="150" style="display: block; max-width: 150px; height: auto;">
            </td>
          </tr>
          
          <!-- Success Banner -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #22c55e;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-block; line-height: 60px; margin-bottom: 15px;">
                      <span style="color: #ffffff; font-size: 30px;">✓</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Order Confirmed!</h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Thank you for your order, {{customer_name}}!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 25px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 18px; font-weight: bold;">Order Details</h2>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                          <strong>Customer:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          {{customer_name}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                          <strong>Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          {{customer_email}}
                        </td>
                      </tr>
                      {{#if customer_phone}}
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                          <strong>Phone:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          {{customer_phone}}
                        </td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                          <strong>Order Number:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          #{{order_id}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                          <strong>{{fulfillment_label}}:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          {{delivery_date}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 14px;">
                          <strong>{{address_label}}:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; text-align: right;">
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
            <td style="padding: 0 20px 25px 20px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: bold;">Your Order</h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 15px; font-size: 14px; font-weight: bold;">Item</td>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 15px; font-size: 14px; font-weight: bold; text-align: center;">Price</td>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 15px; font-size: 14px; font-weight: bold; text-align: center;">Qty</td>
                  <td style="background-color: #166534; color: #ffffff; padding: 12px 15px; font-size: 14px; font-weight: bold; text-align: right;">Total</td>
                </tr>
                {{#each order_items}}
                <tr>
                  <td style="padding: 12px 15px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">{{meal_name}}</td>
                  <td style="padding: 12px 15px; font-size: 14px; color: #374151; text-align: center; border-bottom: 1px solid #e5e7eb;">£{{unit_price}}</td>
                  <td style="padding: 12px 15px; font-size: 14px; color: #374151; text-align: center; border-bottom: 1px solid #e5e7eb;">{{quantity}}</td>
                  <td style="padding: 12px 15px; font-size: 14px; color: #374151; text-align: right; border-bottom: 1px solid #e5e7eb;">£{{total_price}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Totals -->
          <tr>
            <td style="padding: 0 20px 25px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                <tr>
                  <td style="padding: 8px 15px; font-size: 14px; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 8px 15px; font-size: 14px; color: #374151; text-align: right;">£{{subtotal}}</td>
                </tr>
                {{#if has_discount}}
                <tr>
                  <td style="padding: 8px 15px; font-size: 14px; color: #22c55e;">Discount:</td>
                  <td style="padding: 8px 15px; font-size: 14px; color: #22c55e; text-align: right;">-£{{discount_amount}}</td>
                </tr>
                {{/if}}
                <tr>
                  <td style="padding: 8px 15px; font-size: 14px; color: #6b7280;">{{fulfillment_label}} Fee:</td>
                  <td style="padding: 8px 15px; font-size: 14px; color: #374151; text-align: right;">£{{delivery_fee}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; font-size: 18px; font-weight: bold; color: #166534; border-top: 2px solid #e5e7eb;">Total:</td>
                  <td style="padding: 12px 15px; font-size: 18px; font-weight: bold; color: #166534; text-align: right; border-top: 2px solid #e5e7eb;">£{{total_amount}}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Action Buttons - Side by Side -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://fitfoodtasty.co.uk/orders" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">View Your Orders</a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="{{reorder_url}}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Reorder This Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Notes (if any) -->
          {{#if order_notes}}
          <tr>
            <td style="padding: 0 20px 25px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef9c3; border-radius: 8px; border: 1px solid #fde047;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #854d0e;">Order Notes:</p>
                    <p style="margin: 0; font-size: 14px; color: #a16207;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; background-color: #1f2937; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: bold;">Thank you for choosing Fit Food Tasty!</p>
              <p style="margin: 0 0 15px 0; color: #9ca3af; font-size: 14px;">Questions? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #22c55e; text-decoration: none;">info@fitfoodtasty.co.uk</a></p>
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                <a href="https://instagram.com/fitfoodtasty" style="color: #22c55e; text-decoration: none;">Follow us on Instagram @fitfoodtasty</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  subject_template = 'Order Confirmed - #{{order_id}} | Fit Food Tasty',
  updated_at = now()
WHERE template_type = 'order_confirmation' AND is_active = true;