-- Update the order confirmation email template to add a styled Reorder button
UPDATE order_email_templates
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; max-width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);">
              <img src="https://fitfoodtasty.co.uk/lovable-uploads/a26a6a7e-725d-4909-a524-70b0f1c49683.png" alt="Fit Food Tasty" width="180" style="display: block; max-width: 180px; height: auto;" />
            </td>
          </tr>
          
          <!-- Success Banner -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 28px 40px; background-color: #22c55e;">
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Order Confirmed!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <p style="margin: 0 0 8px; font-size: 18px; color: #1a1a1a;">Hi <strong>{{customer_name}}</strong>,</p>
              <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.6;">Thank you for your order! We''re preparing your delicious meals with care.</p>
            </td>
          </tr>
          
          <!-- Order Details Card -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Order ID</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; font-weight: 600; color: #1a1a1a; font-family: monospace;">#{{order_id}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Customer Name</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; font-weight: 600; color: #1a1a1a;">{{customer_name}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Customer E-Mail</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; font-weight: 600; color: #1a1a1a;">{{customer_email}}</span>
                        </td>
                      </tr>
                      {{#if has_customer_phone}}
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">Phone</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; font-weight: 600; color: #1a1a1a;">{{customer_phone}}</span>
                        </td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; color: #6b7280;">{{delivery_method}} Date</span>
                        </td>
                        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="font-size: 14px; font-weight: 600; color: #22c55e;">{{delivery_date}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #6b7280;">{{delivery_method}} Address</span>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="font-size: 14px; font-weight: 600; color: #1a1a1a;">{{delivery_address}}</span>
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
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">Your Meals</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #f9fafb;">
                  <th align="left" style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                  <th align="center" style="padding: 12px 8px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                  <th align="center" style="padding: 12px 8px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                  <th align="right" style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                </tr>
                {{#each order_items}}
                <tr>
                  <td style="padding: 14px 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #1a1a1a; font-weight: 500;">{{meal_name}}</td>
                  <td align="center" style="padding: 14px 8px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">£{{unit_price}}</td>
                  <td align="center" style="padding: 14px 8px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">{{quantity}}</td>
                  <td align="right" style="padding: 14px 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #1a1a1a; font-weight: 600;">£{{total_price}}</td>
                </tr>
                {{/each}}
              </table>
            </td>
          </tr>
          
          <!-- Order Totals -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="font-size: 14px; color: #6b7280;">Subtotal</span>
                        </td>
                        <td align="right" style="padding: 4px 0;">
                          <span style="font-size: 14px; color: #1a1a1a;">£{{subtotal}}</span>
                        </td>
                      </tr>
                      {{#if has_discount}}
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="font-size: 14px; color: #22c55e;">Discount</span>
                        </td>
                        <td align="right" style="padding: 4px 0;">
                          <span style="font-size: 14px; color: #22c55e; font-weight: 600;">-£{{discount_amount}}</span>
                        </td>
                      </tr>
                      {{/if}}
                      {{#if has_delivery_fee}}
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="font-size: 14px; color: #6b7280;">Delivery</span>
                        </td>
                        <td align="right" style="padding: 4px 0;">
                          <span style="font-size: 14px; color: #1a1a1a;">£{{delivery_fee}}</span>
                        </td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td colspan="2" style="padding: 12px 0 0;">
                          <div style="border-top: 2px solid #e5e7eb; padding-top: 12px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td>
                                  <span style="font-size: 18px; font-weight: 700; color: #1a1a1a;">Total</span>
                                </td>
                                <td align="right">
                                  <span style="font-size: 24px; font-weight: 700; color: #22c55e;">£{{total_amount}}</span>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 40px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://fitfoodtasty.co.uk/orders" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; letter-spacing: 0.3px;">View Your Orders</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Reorder Button -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{reorder_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">🔄 Reorder This Exact Order</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <span style="font-size: 12px; color: #9ca3af;">One-click reorder with all the same meals</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Notes (if present) -->
          {{#if has_order_notes}}
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 12px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">📝 Order Notes</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">{{order_notes}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/if}}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1a1a1a;">{{business_name}}</p>
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">{{business_address}}</p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">📞 {{business_phone}}</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Questions? Reply to this email or give us a call.</p>
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