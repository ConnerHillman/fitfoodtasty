-- Create gift card products table for predefined amounts
CREATE TABLE public.gift_card_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create main gift cards table
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  balance NUMERIC NOT NULL CHECK (balance >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  
  -- Purchaser information
  purchaser_user_id UUID,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT NOT NULL,
  
  -- Recipient information
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  
  -- Timestamps
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '12 months'),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_user_id UUID,
  
  -- Payment tracking
  stripe_payment_intent_id TEXT,
  order_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift card transactions table for tracking usage
CREATE TABLE public.gift_card_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id UUID,
  amount_used NUMERIC NOT NULL CHECK (amount_used > 0),
  remaining_balance NUMERIC NOT NULL CHECK (remaining_balance >= 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'partial_use', 'refund')),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gift_card_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for gift_card_products
CREATE POLICY "Everyone can view active gift card products"
  ON public.gift_card_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage gift card products"
  ON public.gift_card_products FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create policies for gift_cards
CREATE POLICY "Users can view their own gift cards"
  ON public.gift_cards FOR SELECT
  USING (
    auth.uid() = purchaser_user_id OR 
    auth.uid() = redeemed_by_user_id OR
    auth.jwt() ->> 'email' = recipient_email OR
    auth.jwt() ->> 'email' = purchaser_email
  );

CREATE POLICY "Users can create gift cards"
  ON public.gift_cards FOR INSERT
  WITH CHECK (auth.uid() = purchaser_user_id);

CREATE POLICY "Users can update their own gift cards"
  ON public.gift_cards FOR UPDATE
  USING (auth.uid() = purchaser_user_id OR auth.uid() = redeemed_by_user_id);

CREATE POLICY "Admins can manage all gift cards"
  ON public.gift_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for gift_card_transactions
CREATE POLICY "Users can view their gift card transactions"
  ON public.gift_card_transactions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.gift_cards gc 
      WHERE gc.id = gift_card_transactions.gift_card_id 
      AND (gc.purchaser_user_id = auth.uid() OR gc.redeemed_by_user_id = auth.uid())
    )
  );

CREATE POLICY "System can create gift card transactions"
  ON public.gift_card_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all gift card transactions"
  ON public.gift_card_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX idx_gift_cards_purchaser_user_id ON public.gift_cards(purchaser_user_id);
CREATE INDEX idx_gift_cards_recipient_email ON public.gift_cards(recipient_email);
CREATE INDEX idx_gift_cards_expires_at ON public.gift_cards(expires_at);
CREATE INDEX idx_gift_card_transactions_gift_card_id ON public.gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_card_transactions_order_id ON public.gift_card_transactions(order_id);

-- Create trigger for updated_at columns
CREATE TRIGGER update_gift_card_products_updated_at
  BEFORE UPDATE ON public.gift_card_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique gift card codes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.gift_cards WHERE code = result) LOOP
    result := '';
    FOR i IN 1..12 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to validate and redeem gift cards
CREATE OR REPLACE FUNCTION public.validate_gift_card(gift_card_code TEXT, amount_to_use NUMERIC DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_record RECORD;
  amount_used NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Find the gift card
  SELECT * INTO card_record
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(gift_card_code));
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Gift card not found');
  END IF;
  
  -- Check if expired
  IF card_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Gift card has expired');
  END IF;
  
  -- Check if cancelled
  IF card_record.status = 'cancelled' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Gift card has been cancelled');
  END IF;
  
  -- Check if has balance
  IF card_record.balance <= 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Gift card has no remaining balance');
  END IF;
  
  -- If amount_to_use is provided, validate and calculate usage
  IF amount_to_use IS NOT NULL THEN
    IF amount_to_use <= 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Invalid amount');
    END IF;
    
    amount_used := LEAST(amount_to_use, card_record.balance);
    new_balance := card_record.balance - amount_used;
    
    RETURN jsonb_build_object(
      'valid', true,
      'gift_card_id', card_record.id,
      'code', card_record.code,
      'current_balance', card_record.balance,
      'amount_used', amount_used,
      'new_balance', new_balance,
      'fully_redeemed', new_balance = 0
    );
  ELSE
    -- Just validation, no usage
    RETURN jsonb_build_object(
      'valid', true,
      'gift_card_id', card_record.id,
      'code', card_record.code,
      'balance', card_record.balance,
      'expires_at', card_record.expires_at
    );
  END IF;
END;
$$;

-- Insert default gift card product options
INSERT INTO public.gift_card_products (amount, name, description, sort_order) VALUES
(25, '£25 Gift Card', 'Perfect for trying our delicious meals', 1),
(50, '£50 Gift Card', 'Great for a week of healthy meals', 2),
(75, '£75 Gift Card', 'Ideal for meal planning', 3),
(100, '£100 Gift Card', 'Perfect for two weeks of meals', 4),
(150, '£150 Gift Card', 'Great for families', 5),
(200, '£200 Gift Card', 'Ultimate meal prep package', 6);