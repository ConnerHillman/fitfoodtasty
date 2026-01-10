-- Step 1: Deactivate the "TESTER 1 !" template that's currently active
UPDATE public.order_email_templates
SET is_active = false, updated_at = now()
WHERE id = '77921591-dee2-4a08-b913-2df1f5ff381d';

-- Step 2: Activate the correct default template with all our improvements
UPDATE public.order_email_templates
SET is_active = true, updated_at = now()
WHERE id = '428d1c09-3b17-404a-af37-830b4aff27f1';

-- Step 3: Update the default template with enhanced design (smaller logo, CTA button, fixed checkmark, social links)
UPDATE public.order_email_templates
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 20px 40px 15px 40px; background-color: #ffffff;">
              <img src="https://fitfoodtasty.co.uk/lovable-uploads/a4f5ea12-e388-48b6-abc3-4e7e0ec80763.png" alt="Fit Food Tasty" width="150" style="display: block; max-width: 150px; height: auto;">
            </td>
          </tr>
          
          <!-- Success Banner with Fixed Checkmark -->
          <tr>
            <td style="padding: 10px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <!-- Checkmark Circle -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="width: 50px; height: 50px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 28px; line-height: 50px;">✓</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 15px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Order Confirmed!</p>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Thank you for your order, {{customer_name}}!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Details Box -->
          <tr>
            <td style="padding: 20px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</h2>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
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
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px; font-weight: 700;">#{{order_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">Order Date:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{order_date}}</td>
                      </tr>
                      {{#if delivery_date}}
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">Delivery Date:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{delivery_date}}</td>
                      </tr>
                      {{/if}}
                      {{#if delivery_address}}
                      <tr>
                        <td style="padding: 6px 0; color: #166534; font-size: 14px; font-weight: 600;">Delivery Address:</td>
                        <td style="padding: 6px 0; color: #15803d; font-size: 14px;">{{delivery_address}}</td>
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
            <td style="padding: 0 40px 20px 40px;">
              <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Your Items</h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 15px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Item</td>
                  <td style="padding: 12px 15px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; text-align: center;">Qty</td>
                  <td style="padding: 12px 15px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; text-align: right;">Price</td>
                </tr>
                {{#each items}}
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 15px; color: #1e293b; font-size: 14px; font-weight: 500;">{{this.name}}</td>
                  <td style="padding: 15px; color: #64748b; font-size: 14px; text-align: center;">{{this.quantity}}</td>
                  <td style="padding: 15px; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">£{{this.total}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Order Totals -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 14px;">Subtotal</td>
                        <td style="padding: 5px 0; color: #1e293b; font-size: 14px; text-align: right;">£{{subtotal}}</td>
                      </tr>
                      {{#if has_delivery_fee}}
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 14px;">Delivery</td>
                        <td style="padding: 5px 0; color: #1e293b; font-size: 14px; text-align: right;">£{{delivery_fee}}</td>
                      </tr>
                      {{/if}}
                      {{#if has_discount}}
                      <tr>
                        <td style="padding: 5px 0; color: #22c55e; font-size: 14px;">Discount</td>
                        <td style="padding: 5px 0; color: #22c55e; font-size: 14px; text-align: right;">-£{{discount_amount}}</td>
                      </tr>
                      {{/if}}
                      <tr style="border-top: 2px solid #e2e8f0;">
                        <td style="padding: 12px 0 5px 0; color: #1e293b; font-size: 18px; font-weight: 700;">Total</td>
                        <td style="padding: 12px 0 5px 0; color: #22c55e; font-size: 18px; font-weight: 700; text-align: right;">£{{total}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- View Order CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 25px 40px;">
              <a href="https://fitfoodtasty.co.uk/orders/{{order_id}}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">View Order Details</a>
            </td>
          </tr>
          
          <!-- Order Notes -->
          {{#if has_order_notes}}
          <tr>
            <td style="padding: 0 40px 25px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fefce8; border-radius: 8px; border: 1px solid #fef08a;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 5px 0; color: #a16207; font-size: 13px; font-weight: 600; text-transform: uppercase;">Order Notes</p>
                    <p style="margin: 0; color: #854d0e; font-size: 14px;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #1e293b; border-radius: 0 0 16px 16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px;">Questions? Contact us at <a href="mailto:orders@fitfoodtasty.co.uk" style="color: #22c55e; text-decoration: none;">orders@fitfoodtasty.co.uk</a></p>
                    <p style="margin: 0 0 15px 0; color: #64748b; font-size: 12px;">© {{current_year}} Fit Food Tasty. All rights reserved.</p>
                    <!-- Social Links -->
                    <a href="https://instagram.com/fitfoodtasty" style="display: inline-block; color: #94a3b8; text-decoration: none; font-size: 13px;">Follow us on Instagram</a>
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