-- Create table for abandoned cart settings
CREATE TABLE public.abandoned_cart_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_cart_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can manage abandoned cart settings" 
ON public.abandoned_cart_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.abandoned_cart_settings (setting_name, setting_value, description) VALUES
('enabled', 'false', 'Enable/disable abandoned cart recovery'),
('first_email_delay_hours', '1', 'Hours to wait before sending first recovery email'),
('second_email_delay_hours', '24', 'Hours to wait before sending second recovery email'),
('discount_percentage', '10', 'Discount percentage to offer in recovery emails'),
('email_subject', 'Don''t forget your items!', 'Subject line for recovery emails'),
('email_template', 'Hi {customer_name}, you left some items in your cart. Complete your order now and save {discount}%!', 'Email template with placeholders');

-- Create table for tracking abandoned carts
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  cart_items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'gbp',
  abandoned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovery_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own abandoned carts" 
ON public.abandoned_carts 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "System can manage abandoned carts" 
ON public.abandoned_carts 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create table for tracking recovery emails
CREATE TABLE public.abandoned_cart_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  abandoned_cart_id UUID NOT NULL REFERENCES public.abandoned_carts(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'first_reminder' or 'second_reminder'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_subject TEXT NOT NULL,
  email_content TEXT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_cart_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view email logs" 
ON public.abandoned_cart_emails 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage email logs" 
ON public.abandoned_cart_emails 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX idx_abandoned_carts_user_id ON public.abandoned_carts(user_id);
CREATE INDEX idx_abandoned_carts_abandoned_at ON public.abandoned_carts(abandoned_at);
CREATE INDEX idx_abandoned_carts_recovered_at ON public.abandoned_carts(recovered_at);
CREATE INDEX idx_abandoned_cart_emails_cart_id ON public.abandoned_cart_emails(abandoned_cart_id);

-- Create trigger to update timestamps
CREATE TRIGGER update_abandoned_cart_settings_updated_at
BEFORE UPDATE ON public.abandoned_cart_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();