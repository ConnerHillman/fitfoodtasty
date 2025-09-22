-- Fix multiple active order confirmation templates
-- Keep only the most recent one active
UPDATE order_email_templates 
SET is_active = false 
WHERE template_type = 'order_confirmation' 
  AND id = '428d1c09-3b17-404a-af37-830b4aff27f1';

-- Add a partial unique index to prevent multiple active templates of the same type
CREATE UNIQUE INDEX CONCURRENTLY idx_unique_active_template_per_type 
ON order_email_templates (template_type) 
WHERE is_active = true;