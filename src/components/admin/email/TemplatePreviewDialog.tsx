import { useState } from "react";
import Handlebars from "handlebars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin } from "lucide-react";

interface OrderEmailTemplate {
  id: string;
  template_name: string;
  subject_template: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  is_default: boolean;
  variables?: string[];
  created_at: string;
  updated_at: string;
}

interface TemplatePreviewDialogProps {
  template: OrderEmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

// Sample order items for preview
const sampleOrderItems = [
  { meal_name: "Chicken Tikka Masala", quantity: 3, unit_price: "£8.99", total_price: "£26.97" },
  { meal_name: "Beef Lasagna", quantity: 2, unit_price: "£9.49", total_price: "£18.98" },
  { meal_name: "Vegetable Stir Fry", quantity: 1, unit_price: "£7.99", total_price: "£7.99" },
];

const getDeliverySampleData = () => ({
  // Customer info
  customer_name: "John Smith",
  customer_email: "john.smith@example.com",
  customer_phone: "07700 900123",
  has_customer_phone: true,
  
  // Order info
  order_id: "ORD-2024-001",
  full_order_id: "abc12345-6789-def0-1234-567890abcdef",
  order_date: "Friday, 10th January 2025",
  
  // Fulfillment - Delivery mode
  is_collection: false,
  is_delivery: true,
  fulfillment_label: "Delivery Date",
  address_label: "Delivery Address",
  collection_point_name: "",
  has_collection_point: false,
  
  // Dates
  requested_delivery_date: "Monday, 13th January 2025",
  has_requested_delivery_date: true,
  delivery_date: "Monday, 13th January 2025",
  
  // Address
  delivery_address: "123 High Street, Manchester, M1 2AB",
  has_delivery_address: true,
  full_delivery_address: "123 High Street, Manchester, M1 2AB",
  delivery_method: "delivery",
  
  // Items
  order_items: sampleOrderItems,
  
  // Pricing
  subtotal: "£53.94",
  discount_amount: "£5.00",
  has_discount: true,
  delivery_fee: "£3.99",
  has_delivery_fee: true,
  total_amount: "£52.93",
  
  // Business
  business_name: "Fit Food Tasty",
  reorder_url: "https://example.com/reorder/abc12345",
});

const getCollectionSampleData = () => ({
  // Customer info
  customer_name: "Jane Doe",
  customer_email: "jane.doe@example.com",
  customer_phone: "07700 900456",
  has_customer_phone: true,
  
  // Order info
  order_id: "ORD-2024-002",
  full_order_id: "def67890-1234-abc5-6789-0abcdef12345",
  order_date: "Friday, 10th January 2025",
  
  // Fulfillment - Collection mode
  is_collection: true,
  is_delivery: false,
  fulfillment_label: "Collection Date",
  address_label: "Collection Point",
  collection_point_name: "Invictus Gym - Manchester City Centre",
  has_collection_point: true,
  
  // Dates
  requested_delivery_date: "Tuesday, 14th January 2025",
  has_requested_delivery_date: true,
  delivery_date: "Tuesday, 14th January 2025",
  
  // Address
  delivery_address: "Invictus Gym, 45 Deansgate, Manchester, M3 2AY",
  has_delivery_address: true,
  full_delivery_address: "Invictus Gym, 45 Deansgate, Manchester, M3 2AY",
  delivery_method: "collection",
  
  // Items
  order_items: sampleOrderItems,
  
  // Pricing
  subtotal: "£53.94",
  discount_amount: "",
  has_discount: false,
  delivery_fee: "",
  has_delivery_fee: false,
  total_amount: "£53.94",
  
  // Business
  business_name: "Fit Food Tasty",
  reorder_url: "https://example.com/reorder/def67890",
});

export const TemplatePreviewDialog = ({ template, isOpen, onClose }: TemplatePreviewDialogProps) => {
  const [previewMode, setPreviewMode] = useState<'delivery' | 'collection'>('delivery');
  
  if (!template) return null;

  const sampleData = previewMode === 'delivery' ? getDeliverySampleData() : getCollectionSampleData();

  // Compile and render with Handlebars
  let previewHtml = "";
  let previewSubject = "";
  let previewText = "";
  let compileError = "";

  try {
    const compiledHtml = Handlebars.compile(template.html_content);
    previewHtml = compiledHtml(sampleData);
    
    const compiledSubject = Handlebars.compile(template.subject_template);
    previewSubject = compiledSubject(sampleData);
    
    if (template.text_content) {
      const compiledText = Handlebars.compile(template.text_content);
      previewText = compiledText(sampleData);
    }
  } catch (error) {
    compileError = error instanceof Error ? error.message : "Failed to compile template";
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Preview: {template.template_name}</span>
            <Badge variant={template.is_active ? "default" : "secondary"}>
              {template.is_active ? "Active" : "Inactive"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Preview as:</span>
            <div className="flex gap-1">
              <Button
                variant={previewMode === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('delivery')}
                className="gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                Delivery
              </Button>
              <Button
                variant={previewMode === 'collection' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('collection')}
                className="gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                Collection
              </Button>
            </div>
          </div>

          {compileError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              <strong>Template Error:</strong> {compileError}
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Email Subject:</h4>
            <div className="p-3 bg-muted rounded border">
              {previewSubject}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Email Content:</h4>
            <div className="border rounded overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-96"
                title="Email Preview"
                style={{ border: 'none' }}
              />
            </div>
          </div>

          {previewText && (
            <div>
              <h4 className="font-medium mb-2">Text Content:</h4>
              <div className="p-3 bg-muted rounded border whitespace-pre-wrap text-sm">
                {previewText}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Note:</strong> This preview uses sample data. Toggle between Delivery and Collection modes to preview both scenarios.</p>
            <p><strong>Sample Customer:</strong> {sampleData.customer_name} ({sampleData.customer_phone})</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
