-- Add partial unique index for welcome email templates
-- This ensures only one welcome template can be active at a time
CREATE UNIQUE INDEX idx_unique_active_welcome_template 
ON order_email_templates (template_type) 
WHERE is_active = true AND template_type = 'welcome';