-- Create order audit log table
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'individual', -- 'individual' or 'package'
  action_type TEXT NOT NULL, -- 'adjust', 'void', 'refund', 'status_change'
  performed_by UUID NOT NULL, -- user_id of admin who performed action
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  amount_changed NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add refund and audit fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voided_by UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- Add same fields to package_orders table
ALTER TABLE public.package_orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;
ALTER TABLE public.package_orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE public.package_orders ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.package_orders ADD COLUMN IF NOT EXISTS voided_by UUID;
ALTER TABLE public.package_orders ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- Enable RLS on audit log
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit log (if not exists)
DO $$ BEGIN
  CREATE POLICY "Admins can view all audit logs" 
  ON public.order_audit_log 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can create audit logs" 
  ON public.order_audit_log 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_order_audit_log_order_id ON public.order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_log_created_at ON public.order_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_orders_status ON public.package_orders(status);

-- Create function to log order changes
CREATE OR REPLACE FUNCTION public.log_order_change(
  p_order_id UUID,
  p_order_type TEXT,
  p_action_type TEXT,
  p_performed_by UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_amount_changed NUMERIC DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.order_audit_log (
    order_id,
    order_type,
    action_type,
    performed_by,
    old_values,
    new_values,
    reason,
    amount_changed,
    metadata
  ) VALUES (
    p_order_id,
    p_order_type,
    p_action_type,
    p_performed_by,
    p_old_values,
    p_new_values,
    p_reason,
    p_amount_changed,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;