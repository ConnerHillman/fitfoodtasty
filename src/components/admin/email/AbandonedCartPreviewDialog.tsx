import { useState } from "react";
import Handlebars from "handlebars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AbandonedCartTemplate {
  subject: string;
  html_content: string;
}

interface AbandonedCartPreviewDialogProps {
  template: AbandonedCartTemplate | null;
  emailType: string;
  isOpen: boolean;
  onClose: () => void;
}

// Sample abandoned cart data for preview
const getAbandonedCartSampleData = () => ({
  // Customer info
  customer_name: "Sarah Johnson",
  customer_email: "sarah.johnson@example.com",
  
  // Cart items (simple text representation for abandoned cart emails)
  cart_items: `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background-color: #f9fafb;">
        <th style="text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb;">Item</th>
        <th style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">Qty</th>
        <th style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">Price</th>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Chicken Tikka Masala</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">3</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">£26.97</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Beef Lasagna</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">2</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">£18.98</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Vegetable Stir Fry</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">1</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">£7.99</td>
      </tr>
    </table>
  `,
  
  // Pricing
  total_amount: "53.94",
  
  // Recovery URL
  recovery_url: "https://fitfoodtasty.co.uk/cart?recover=abc123",
  checkout_url: "https://fitfoodtasty.co.uk/cart",
  
  // Business info
  business_name: "Fit Food Tasty",
  business_phone: "07961 719602",
  website_url: "https://fitfoodtasty.co.uk",
  menu_url: "https://fitfoodtasty.co.uk/menu",
  
  // Misc
  current_year: new Date().getFullYear(),
  
  // Urgency helpers for different email stages
  hours_since_abandoned: "1",
});

const getEmailTypeLabel = (type: string) => {
  switch (type) {
    case 'first':
      return 'First Email (1 hour)';
    case 'second':
      return 'Second Email (24 hours)';
    case 'third':
      return 'Final Email (72 hours)';
    default:
      return type;
  }
};

export const AbandonedCartPreviewDialog = ({ 
  template, 
  emailType, 
  isOpen, 
  onClose 
}: AbandonedCartPreviewDialogProps) => {
  if (!template) return null;

  const sampleData = getAbandonedCartSampleData();

  // Compile and render with Handlebars
  let previewHtml = "";
  let previewSubject = "";
  let compileError = "";

  try {
    if (template.html_content) {
      const compiledHtml = Handlebars.compile(template.html_content);
      previewHtml = compiledHtml(sampleData);
    }
    
    if (template.subject) {
      const compiledSubject = Handlebars.compile(template.subject);
      previewSubject = compiledSubject(sampleData);
    }
  } catch (error) {
    compileError = error instanceof Error ? error.message : "Failed to compile template";
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Preview: Abandoned Cart Email</span>
            <Badge variant="outline" className="capitalize">
              {getEmailTypeLabel(emailType)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {compileError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              <strong>Template Error:</strong> {compileError}
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Email Subject:</h4>
            <div className="p-3 bg-muted rounded border">
              {previewSubject || <span className="text-muted-foreground italic">No subject set</span>}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Email Content:</h4>
            <div className="border rounded overflow-hidden">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-96"
                  title="Email Preview"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No HTML content set. Add your email template to preview it here.
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Note:</strong> This preview uses sample abandoned cart data.</p>
            <p><strong>Sample Customer:</strong> {sampleData.customer_name} ({sampleData.customer_email})</p>
            <p><strong>Sample Cart Total:</strong> £{sampleData.total_amount}</p>
            <p className="pt-2"><strong>Available Variables:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs">
              {`{{customer_name}}, {{customer_email}}, {{cart_items}}, {{total_amount}}, {{recovery_url}}, {{checkout_url}}, {{business_name}}, {{website_url}}, {{menu_url}}, {{current_year}}`}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
