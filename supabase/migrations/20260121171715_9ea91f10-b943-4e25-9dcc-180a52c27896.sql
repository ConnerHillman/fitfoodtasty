-- Create auth email templates table for branded auth emails
CREATE TABLE public.auth_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL UNIQUE, -- 'password_reset', 'email_verification', 'magic_link'
  subject_template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_email_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage auth email templates"
  ON public.auth_email_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default templates
INSERT INTO public.auth_email_templates (email_type, subject_template, html_content) VALUES
('password_reset', 'Reset your Fit Food Tasty password', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180" style="display: block;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Reset your password</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi{{#if customer_name}} {{customer_name}}{{/if}},
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px;">
                <tr>
                  <td align="center" style="background-color: #16a34a; border-radius: 6px;">
                    <a href="{{reset_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                This link will expire in 1 hour. If you didn''t request this, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                If the button doesn''t work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; word-break: break-all; color: #16a34a;">
                {{reset_url}}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Need help? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'),

('email_verification', 'Verify your Fit Food Tasty email', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180" style="display: block;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Verify your email</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi{{#if customer_name}} {{customer_name}}{{/if}},
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Thanks for signing up! Please verify your email address to get started with your healthy meal prep journey:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px;">
                <tr>
                  <td align="center" style="background-color: #16a34a; border-radius: 6px;">
                    <a href="{{verification_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Verify Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                This link will expire in 24 hours.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                If the button doesn''t work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; word-break: break-all; color: #16a34a;">
                {{verification_url}}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Need help? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'),

('magic_link', 'Your Fit Food Tasty login link', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180" style="display: block;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Your login link</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi{{#if customer_name}} {{customer_name}}{{/if}},
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Click the button below to securely log in to your account:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px;">
                <tr>
                  <td align="center" style="background-color: #16a34a; border-radius: 6px;">
                    <a href="{{magic_link_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Log In</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                This link will expire in 1 hour and can only be used once.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                If the button doesn''t work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; word-break: break-all; color: #16a34a;">
                {{magic_link_url}}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Need help? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>');

-- Add refund and void templates to order_email_templates
INSERT INTO public.order_email_templates (template_name, template_type, subject_template, html_content, is_active) VALUES
('Refund Confirmation', 'refund', 'Your refund has been processed - Order #{{order_number}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Refund Processed</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi {{customer_name}},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                We have processed a refund for your order. Here are the details:
              </p>
              <table role="presentation" width="100%" style="background-color: #f9f9f9; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px;"><strong>Order:</strong> #{{order_number}}</p>
                    <p style="margin: 0 0 10px;"><strong>Refund Amount:</strong> £{{refund_amount}}</p>
                    {{#if refund_reason}}<p style="margin: 0;"><strong>Reason:</strong> {{refund_reason}}</p>{{/if}}
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; color: #6a6a6a;">
                The refund should appear in your account within 5-10 business days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Questions? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', true),

('Order Cancelled', 'void', 'Your order has been cancelled - Order #{{order_number}}', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Order Cancelled</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi {{customer_name}},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Your order #{{order_number}} has been cancelled.
              </p>
              {{#if refund_amount}}
              <table role="presentation" width="100%" style="background-color: #f9f9f9; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px;"><strong>Refund Amount:</strong> £{{refund_amount}}</p>
                    <p style="margin: 0; font-size: 14px; color: #6a6a6a;">
                      The refund should appear in your account within 5-10 business days.
                    </p>
                  </td>
                </tr>
              </table>
              {{/if}}
              {{#if void_reason}}
              <p style="margin: 0 0 20px; font-size: 14px; color: #6a6a6a;">
                <strong>Reason:</strong> {{void_reason}}
              </p>
              {{/if}}
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                We hope to see you again soon!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Questions? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', true),

('Gift Card Purchase', 'gift_card_purchase', 'Your Fit Food Tasty gift card is ready!', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Your Gift Card is Ready!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi {{purchaser_name}},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Thank you for purchasing a Fit Food Tasty gift card! Here are the details:
              </p>
              <table role="presentation" width="100%" style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding: 30px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6a6a6a;">Gift Card Code</p>
                    <p style="margin: 0 0 20px; font-size: 28px; font-weight: bold; color: #16a34a; letter-spacing: 2px;">{{gift_card_code}}</p>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">£{{gift_card_amount}}</p>
                  </td>
                </tr>
              </table>
              {{#if recipient_name}}
              <p style="margin: 0 0 20px; font-size: 14px; color: #6a6a6a;">
                We''ve sent this gift card to {{recipient_name}} at {{recipient_email}}.
              </p>
              {{/if}}
              <p style="margin: 0; font-size: 14px; color: #6a6a6a;">
                The recipient can use this code at checkout to redeem their gift.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Questions? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', true),

('Gift Card Received', 'gift_card_received', 'You received a Fit Food Tasty gift card!', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" style="background-color: #16a34a; padding: 30px 40px;">
              <img src="https://fitfoodtasty.co.uk/logo.png" alt="Fit Food Tasty" width="180">
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">🎁 You Got a Gift Card!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Hi {{recipient_name}},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                {{purchaser_name}} has sent you a Fit Food Tasty gift card!
              </p>
              {{#if message}}
              <table role="presentation" width="100%" style="background-color: #f9f9f9; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-style: italic; color: #4a4a4a;">"{{message}}"</p>
                  </td>
                </tr>
              </table>
              {{/if}}
              <table role="presentation" width="100%" style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding: 30px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6a6a6a;">Your Gift Card Code</p>
                    <p style="margin: 0 0 20px; font-size: 28px; font-weight: bold; color: #16a34a; letter-spacing: 2px;">{{gift_card_code}}</p>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">£{{gift_card_amount}}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                <tr>
                  <td align="center" style="background-color: #16a34a; border-radius: 6px;">
                    <a href="https://fitfoodtasty.co.uk/menu" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Start Shopping</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; color: #6a6a6a; text-align: center;">
                Enter this code at checkout to redeem your gift.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Questions? Contact us at <a href="mailto:info@fitfoodtasty.co.uk" style="color: #16a34a;">info@fitfoodtasty.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', true);