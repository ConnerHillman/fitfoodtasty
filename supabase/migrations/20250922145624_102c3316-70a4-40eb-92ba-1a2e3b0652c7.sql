-- Create order email templates table
CREATE TABLE public.order_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'order_confirmation',
  subject_template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order emails log table
CREATE TABLE public.order_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'individual',
  email_type TEXT NOT NULL DEFAULT 'order_confirmation',
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  template_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add email notification control to orders table
ALTER TABLE public.orders 
ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add email notification control to package_orders table
ALTER TABLE public.package_orders 
ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.order_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_email_templates
CREATE POLICY "Admins can manage order email templates" 
ON public.order_email_templates 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active order email templates" 
ON public.order_email_templates 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- RLS policies for order_emails
CREATE POLICY "Admins can view all order emails" 
ON public.order_emails 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create order emails" 
ON public.order_emails 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their order emails" 
ON public.order_emails 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_emails.order_id 
    AND o.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.package_orders po 
    WHERE po.id = order_emails.order_id 
    AND po.user_id = auth.uid()
  )
);

-- Insert default order confirmation template
INSERT INTO public.order_email_templates (
  template_name,
  template_type,
  subject_template,
  html_content,
  text_content,
  is_default,
  variables
) VALUES (
  'Default Order Confirmation',
  'order_confirmation',
  'Order Confirmation #{{order_id}}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-details { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank you for your order!</h1>
            <p>Hi {{customer_name}},</p>
            <p>We''ve received your order and will begin preparing it for delivery.</p>
        </div>
        
        <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> {{order_id}}</p>
            <p><strong>Order Date:</strong> {{order_date}}</p>
            <p><strong>Delivery Date:</strong> {{delivery_date}}</p>
            <p><strong>Delivery Address:</strong> {{delivery_address}}</p>
            
            <h3>Items Ordered:</h3>
            {{order_items}}
            
            <div class="total">
                <p>Total: £{{total_amount}}</p>
            </div>
        </div>
        
        {{#if order_notes}}
        <div class="order-details">
            <h3>Order Notes:</h3>
            <p>{{order_notes}}</p>
        </div>
        {{/if}}
        
        <div class="footer">
            <p>If you have any questions about your order, please contact us.</p>
            <p>Thank you for choosing our meal prep service!</p>
        </div>
    </div>
</body>
</html>',
  'Thank you for your order!

Hi {{customer_name}},

We''ve received your order and will begin preparing it for delivery.

Order Details:
Order Number: {{order_id}}
Order Date: {{order_date}}
Delivery Date: {{delivery_date}}
Delivery Address: {{delivery_address}}

Items Ordered:
{{order_items_text}}

Total: £{{total_amount}}

{{#if order_notes}}
Order Notes: {{order_notes}}
{{/if}}

If you have any questions about your order, please contact us.

Thank you for choosing our meal prep service!',
  true,
  '["customer_name", "order_id", "order_date", "delivery_date", "delivery_address", "order_items", "order_items_text", "total_amount", "order_notes"]'::jsonb
);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_order_email_templates_updated_at
    BEFORE UPDATE ON public.order_email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();