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

// Sample abandoned cart data matching edge function structure
const getAbandonedCartSampleData = () => ({
  // Customer info - matches edge function logic
  customer_name: "Sarah",
  has_customer_name: true,
  
  // Cart items array - matches edge function structure
  cart_items: [
    { item_name: "Chicken Tikka Masala", quantity: 3, line_total: "26.97", variant: null },
    { item_name: "Beef Lasagna", quantity: 2, line_total: "18.98", variant: "Large" },
    { item_name: "Vegetable Stir Fry", quantity: 1, line_total: "7.99", variant: null },
  ],
  has_cart_items: true,
  
  // Totals
  cart_total: "53.94",
  has_cart_total: true,
  
  // URLs
  checkout_url: "https://fitfoodtasty.co.uk/cart?recover=sample123",
  menu_url: "https://fitfoodtasty.co.uk/menu",
  website_url: "https://fitfoodtasty.co.uk",
  
  // Business info
  business_name: "Fit Food Tasty",
  support_email: "info@fitfoodtasty.co.uk",
  
  // Year
  current_year: new Date().getFullYear(),
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
            <p><strong>Sample Customer:</strong> {sampleData.customer_name}</p>
            <p><strong>Sample Cart Total:</strong> £{sampleData.cart_total}</p>
            <p className="pt-2"><strong>Available Variables:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs whitespace-pre-wrap">
{`{{customer_name}} - Customer first name (with {{#if has_customer_name}} check)
{{#each cart_items}} - Loop through items with:
  {{item_name}}, {{quantity}}, {{line_total}}, {{variant}}
{{cart_total}} - Total amount (with {{#if has_cart_total}} check)
{{checkout_url}} - Recovery checkout link
{{menu_url}} - Menu page link
{{support_email}} - Support email address
{{current_year}} - Current year for copyright`}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
