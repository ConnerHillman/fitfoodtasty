-- Create table for email templates
CREATE TABLE public.abandoned_cart_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL UNIQUE, -- 'first', 'second', 'third'
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_cart_email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage email templates" 
ON public.abandoned_cart_email_templates 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default templates
INSERT INTO public.abandoned_cart_email_templates (email_type, subject, html_content) VALUES
('first', 'Don''t forget your delicious meals! 🍽️', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hi {{customer_name}},</h2>
  <p>You left some amazing meals in your cart! Don''t miss out on these delicious, healthy options.</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Your Cart:</h3>
    {{cart_items}}
    <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
      Total: £{{total_amount}}
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://fitfoodtasty.com/cart" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Complete Your Order
    </a>
  </div>
  
  <p>Your healthy lifestyle is just one click away!</p>
  <p>Best regards,<br>The Fit Food Tasty Team</p>
</div>'),

('second', 'Still thinking about those meals? 🤔', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hi {{customer_name}},</h2>
  <p>We noticed you''re still considering your meal selection. Here''s what you had in mind:</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Your Saved Cart:</h3>
    {{cart_items}}
    <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
      Total: £{{total_amount}}
    </div>
  </div>
  
  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h4>💡 Why Choose Fit Food Tasty?</h4>
    <ul>
      <li>Fresh, healthy ingredients</li>
      <li>Nutritionally balanced meals</li>
      <li>Convenient delivery</li>
      <li>No meal prep required</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://fitfoodtasty.com/cart" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Complete Your Order Now
    </a>
  </div>
  
  <p>Questions? Just reply to this email - we''re here to help!</p>
  <p>Best regards,<br>The Fit Food Tasty Team</p>
</div>'),

('third', 'Last chance: Your meals are waiting! ⏰', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hi {{customer_name}},</h2>
  <p>This is our final reminder about the delicious meals waiting in your cart.</p>
  
  <div style="background: #fee2e2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>⚠️ Cart Expiring Soon</h3>
    <p>Your selected meals will be removed from your cart soon. Don''t miss out!</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Your Cart:</h3>
    {{cart_items}}
    <div style="margin-top: 15px; font-size: 18px; font-weight: bold;">
      Total: £{{total_amount}}
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://fitfoodtasty.com/cart" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Save My Cart - Order Now
    </a>
  </div>
  
  <p>After this, you''ll need to add the meals to your cart again.</p>
  <p>Thank you for considering Fit Food Tasty!</p>
  <p>Best regards,<br>The Fit Food Tasty Team</p>
</div>');

-- Create trigger for updated_at
CREATE TRIGGER update_abandoned_cart_email_templates_updated_at
BEFORE UPDATE ON public.abandoned_cart_email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();