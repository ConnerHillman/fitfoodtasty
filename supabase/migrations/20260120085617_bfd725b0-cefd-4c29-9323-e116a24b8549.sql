-- Update First Email Template (1 hour)
UPDATE abandoned_cart_email_templates
SET 
  subject = '{{#if has_customer_name}}{{customer_name}}, your{{else}}Your{{/if}} meals are waiting 🍽️',
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete your order</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png"
                   alt="Fit Food Tasty" width="150" style="display: block; max-width: 150px; height: auto;">
            </td>
          </tr>

          <!-- Green Banner -->
          <tr>
            <td align="center" style="padding: 28px 20px; background-color: #22c55e;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
                <tr>
                  <td style="background-color: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); border-radius: 14px; padding: 22px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left" style="vertical-align: middle;">
                          <span style="background-color: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); padding: 8px 12px; border-radius: 999px; color:#ffffff; font-size: 14px; font-weight: bold;">
                            🛒 YOUR CART
                          </span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 16px 0 6px 0; color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1.15;">
                      You''re one step away 👀
                    </h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.5;">
                      Your meals are waiting — checkout takes less than a minute.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 25px 20px; color: #374151; font-size: 15px; line-height: 1.7;">
              <p style="margin: 0 0 12px 0;">
                Hi{{#if has_customer_name}} <strong style="color:#111827;">{{customer_name}}</strong>{{else}} there{{/if}},
              </p>
              <p style="margin: 0 0 14px 0;">
                Looks like you added some meals to your cart but didn''t finish checking out. No worries — we''ve saved everything for you.
              </p>

              <!-- Cart Summary Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; margin: 18px 0;">
                <tr>
                  <td style="padding: 18px;">
                    <h2 style="margin: 0 0 12px 0; color: #166534; font-size: 18px; font-weight: bold;">Your cart</h2>
                    
                    {{#if has_cart_items}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                      {{#each cart_items}}
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #166534; border-bottom: 1px solid #bbf7d0;">
                          <strong>{{item_name}}</strong>{{#if variant}} <span style="color:#15803d;">— {{variant}}</span>{{/if}}
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #15803d; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          x{{quantity}} &nbsp; £{{line_total}}
                        </td>
                      </tr>
                      {{/each}}
                    </table>
                    {{else}}
                    <p style="margin: 0; font-size: 14px; color: #166534;">Your cart is ready to check out.</p>
                    {{/if}}

                    {{#if has_cart_total}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
                      <tr>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #166534; border-top: 1px solid #bbf7d0;">Total</td>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #166534; text-align: right; border-top: 1px solid #bbf7d0;">£{{cart_total}}</td>
                      </tr>
                    </table>
                    {{/if}}
                  </td>
                </tr>
              </table>

              <p style="margin: 18px 0 0 0;">
                Ready when you are 👇
              </p>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <a href="{{checkout_url}}"
                 style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Complete checkout
              </a>
            </td>
          </tr>

          <!-- Secondary text link -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                or <a href="{{menu_url}}" style="color: #22c55e; text-decoration: underline;">browse our menu</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; background-color: #1f2937; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: bold;">Need a hand?</p>
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Questions? Contact us at <a href="mailto:{{support_email}}" style="color: #22c55e; text-decoration: none;">{{support_email}}</a>
              </p>
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px;">
                © {{current_year}} {{business_name}}
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
WHERE email_type = 'first';

-- Update Second Email Template (24 hours)
UPDATE abandoned_cart_email_templates
SET 
  subject = 'Still thinking it over? Your cart is saved 🛒',
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your cart is waiting</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png"
                   alt="Fit Food Tasty" width="150" style="display: block; max-width: 150px; height: auto;">
            </td>
          </tr>

          <!-- Green Banner -->
          <tr>
            <td align="center" style="padding: 28px 20px; background-color: #22c55e;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
                <tr>
                  <td style="background-color: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); border-radius: 14px; padding: 22px 18px;">
                    <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1.15;">
                      Your meals miss you 💚
                    </h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.5;">
                      Your cart is still saved and ready to go.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 25px 20px; color: #374151; font-size: 15px; line-height: 1.7;">
              <p style="margin: 0 0 12px 0;">
                Hi{{#if has_customer_name}} <strong style="color:#111827;">{{customer_name}}</strong>{{else}} there{{/if}},
              </p>
              <p style="margin: 0 0 14px 0;">
                Just a quick reminder — you''ve still got meals waiting in your cart. We didn''t want you to miss out!
              </p>

              <!-- Cart Summary Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; margin: 18px 0;">
                <tr>
                  <td style="padding: 18px;">
                    <h2 style="margin: 0 0 12px 0; color: #166534; font-size: 18px; font-weight: bold;">Your cart</h2>
                    
                    {{#if has_cart_items}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                      {{#each cart_items}}
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #166534; border-bottom: 1px solid #bbf7d0;">
                          <strong>{{item_name}}</strong>{{#if variant}} <span style="color:#15803d;">— {{variant}}</span>{{/if}}
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #15803d; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          x{{quantity}} &nbsp; £{{line_total}}
                        </td>
                      </tr>
                      {{/each}}
                    </table>
                    {{else}}
                    <p style="margin: 0; font-size: 14px; color: #166534;">Your cart is ready to check out.</p>
                    {{/if}}

                    {{#if has_cart_total}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
                      <tr>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #166534; border-top: 1px solid #bbf7d0;">Total</td>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #166534; text-align: right; border-top: 1px solid #bbf7d0;">£{{cart_total}}</td>
                      </tr>
                    </table>
                    {{/if}}
                  </td>
                </tr>
              </table>

              <p style="margin: 18px 0 0 0;">
                Ready to complete your order? 👇
              </p>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <a href="{{checkout_url}}"
                 style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Complete checkout
              </a>
            </td>
          </tr>

          <!-- Secondary text link -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                or <a href="{{menu_url}}" style="color: #22c55e; text-decoration: underline;">browse our menu</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; background-color: #1f2937; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: bold;">Need a hand?</p>
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Questions? Contact us at <a href="mailto:{{support_email}}" style="color: #22c55e; text-decoration: none;">{{support_email}}</a>
              </p>
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px;">
                © {{current_year}} {{business_name}}
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
WHERE email_type = 'second';

-- Update Third Email Template (72 hours - final)
UPDATE abandoned_cart_email_templates
SET 
  subject = 'Last chance: Your cart expires soon ⏰',
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Last chance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <img src="https://aicpnaomarzgborltdkt.supabase.co/storage/v1/object/public/assets/Logo%20FFT%20(CMYK).png"
                   alt="Fit Food Tasty" width="150" style="display: block; max-width: 150px; height: auto;">
            </td>
          </tr>

          <!-- Green Banner -->
          <tr>
            <td align="center" style="padding: 28px 20px; background-color: #22c55e;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
                <tr>
                  <td style="background-color: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); border-radius: 14px; padding: 22px 18px;">
                    <span style="background-color: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); padding: 8px 12px; border-radius: 999px; color:#ffffff; font-size: 14px; font-weight: bold;">
                      ⏰ LAST CHANCE
                    </span>
                    <h1 style="margin: 16px 0 6px 0; color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1.15;">
                      Don''t miss out!
                    </h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.5;">
                      Your cart will expire soon — complete your order now.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 25px 20px; color: #374151; font-size: 15px; line-height: 1.7;">
              <p style="margin: 0 0 12px 0;">
                Hi{{#if has_customer_name}} <strong style="color:#111827;">{{customer_name}}</strong>{{else}} there{{/if}},
              </p>
              <p style="margin: 0 0 14px 0;">
                This is your final reminder — your cart is about to expire. Don''t let your favourite meals slip away!
              </p>

              <!-- Cart Summary Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; margin: 18px 0;">
                <tr>
                  <td style="padding: 18px;">
                    <h2 style="margin: 0 0 12px 0; color: #166534; font-size: 18px; font-weight: bold;">Your cart</h2>
                    
                    {{#if has_cart_items}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                      {{#each cart_items}}
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #166534; border-bottom: 1px solid #bbf7d0;">
                          <strong>{{item_name}}</strong>{{#if variant}} <span style="color:#15803d;">— {{variant}}</span>{{/if}}
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #15803d; text-align: right; border-bottom: 1px solid #bbf7d0;">
                          x{{quantity}} &nbsp; £{{line_total}}
                        </td>
                      </tr>
                      {{/each}}
                    </table>
                    {{else}}
                    <p style="margin: 0; font-size: 14px; color: #166534;">Your cart is ready to check out.</p>
                    {{/if}}

                    {{#if has_cart_total}}
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
                      <tr>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #166534; border-top: 1px solid #bbf7d0;">Total</td>
                        <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #166534; text-align: right; border-top: 1px solid #bbf7d0;">£{{cart_total}}</td>
                      </tr>
                    </table>
                    {{/if}}
                  </td>
                </tr>
              </table>

              <p style="margin: 18px 0 0 0;">
                One click and you''re done 👇
              </p>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <a href="{{checkout_url}}"
                 style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Complete checkout
              </a>
            </td>
          </tr>

          <!-- Secondary text link -->
          <tr>
            <td align="center" style="padding: 0 20px 25px 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                or <a href="{{menu_url}}" style="color: #22c55e; text-decoration: underline;">browse our menu</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 20px; background-color: #1f2937; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: bold;">Need a hand?</p>
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Questions? Contact us at <a href="mailto:{{support_email}}" style="color: #22c55e; text-decoration: none;">{{support_email}}</a>
              </p>
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px;">
                © {{current_year}} {{business_name}}
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
WHERE email_type = 'third';
