-- Update the order confirmation email template with customer details section
UPDATE order_email_templates
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Fit Food Tasty</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #f8f8f8; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header with Logo -->
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #4CAF50;">
      <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png" alt="Fit Food Tasty" style="max-width: 200px; height: auto; margin-bottom: 15px;">
      <h1 style="color: #2E7D32; font-size: 28px; margin: 10px 0;">Order Confirmed!</h1>
      <p style="color: #666; margin: 0;">Thank you for your order, {{customer_name}}</p>
    </div>

    <!-- Customer Details Box -->
    <div style="background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #333; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">Customer Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #666; width: 40%;">Name:</td>
          <td style="padding: 6px 0; font-weight: 500;">{{customer_name}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Email:</td>
          <td style="padding: 6px 0;">{{customer_email}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Phone:</td>
          <td style="padding: 6px 0;">{{customer_phone}}</td>
        </tr>
      </table>
    </div>

    <!-- Order Details Box -->
    <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0;"><strong>Order Number:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 16px;">#{{order_id}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Order Date:</strong></td>
          <td style="padding: 8px 0; text-align: right;">{{order_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>{{delivery_method}} Date:</strong></td>
          <td style="padding: 8px 0; text-align: right;">{{delivery_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>{{delivery_method}} Address:</strong></td>
          <td style="padding: 8px 0; text-align: right;">{{delivery_address}}</td>
        </tr>
      </table>
    </div>

    <!-- Order Items Table -->
    <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">Your Order</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr>
          <th style="background: #4CAF50; color: white; padding: 12px 10px; text-align: left; font-weight: bold;">Item</th>
          <th style="background: #4CAF50; color: white; padding: 12px 10px; text-align: center; font-weight: bold;">Price</th>
          <th style="background: #4CAF50; color: white; padding: 12px 10px; text-align: center; font-weight: bold;">Qty</th>
          <th style="background: #4CAF50; color: white; padding: 12px 10px; text-align: right; font-weight: bold;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each order_items}}
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0;">{{this.meal_name}}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">£{{this.unit_price}}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">{{this.quantity}}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">£{{this.total_price}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0;">Subtotal:</td>
          <td style="padding: 8px 0; text-align: right;">£{{subtotal}}</td>
        </tr>
        {{#if has_discount}}
        <tr style="color: #2E7D32;">
          <td style="padding: 8px 0;">Discount:</td>
          <td style="padding: 8px 0; text-align: right;">-£{{discount_amount}}</td>
        </tr>
        {{/if}}
        {{#if has_delivery_fee}}
        <tr>
          <td style="padding: 8px 0;">Delivery Fee:</td>
          <td style="padding: 8px 0; text-align: right;">£{{delivery_fee}}</td>
        </tr>
        {{/if}}
        <tr style="font-size: 18px; font-weight: bold; border-top: 2px solid #ddd;">
          <td style="padding: 15px 0 8px 0;">Total Paid:</td>
          <td style="padding: 15px 0 8px 0; text-align: right; color: #2E7D32;">£{{total_amount}}</td>
        </tr>
      </table>
    </div>

    {{#if has_order_notes}}
    <!-- Order Notes -->
    <div style="background: #FFF8E1; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #FFC107;">
      <strong style="color: #F57C00;">Order Notes:</strong>
      <p style="margin: 10px 0 0 0; color: #666;">{{order_notes}}</p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e0e0e0; color: #888; font-size: 13px;">
      <p style="margin: 0 0 10px 0;"><strong>{{business_name}}</strong></p>
      <p style="margin: 0 0 5px 0;">{{business_address}}</p>
      <p style="margin: 0 0 15px 0;">Phone: {{business_phone}}</p>
      <p style="margin: 0; font-size: 12px;">Questions about your order? Reply to this email and we''ll be happy to help!</p>
    </div>

  </div>
</body>
</html>',
text_content = 'ORDER CONFIRMED!

Thank you for your order, {{customer_name}}!

CUSTOMER DETAILS
Name: {{customer_name}}
Email: {{customer_email}}
Phone: {{customer_phone}}

ORDER DETAILS
Order Number: #{{order_id}}
Order Date: {{order_date}}
{{delivery_method}} Date: {{delivery_date}}
{{delivery_method}} Address: {{delivery_address}}

YOUR ORDER
{{#each order_items}}
{{this.meal_name}} x {{this.quantity}} - £{{this.total_price}}
{{/each}}

Subtotal: £{{subtotal}}
{{#if has_discount}}Discount: -£{{discount_amount}}{{/if}}
{{#if has_delivery_fee}}Delivery Fee: £{{delivery_fee}}{{/if}}
Total Paid: £{{total_amount}}

{{#if has_order_notes}}Order Notes: {{order_notes}}{{/if}}

{{business_name}}
{{business_address}}
Phone: {{business_phone}}

Questions about your order? Reply to this email and we''ll be happy to help!'
WHERE id = '77921591-dee2-4a08-b913-2df1f5ff381d';