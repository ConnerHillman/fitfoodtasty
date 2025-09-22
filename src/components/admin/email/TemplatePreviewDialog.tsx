import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

export const TemplatePreviewDialog = ({ template, isOpen, onClose }: TemplatePreviewDialogProps) => {
  if (!template) return null;

  // Sample data for preview
  const sampleData = {
    order_number: "ORD-2024-001",
    customer_name: "John Doe",
    order_total: "£45.99",
    delivery_date: "2024-01-15",
    items: "3x Chicken Tikka Masala, 2x Beef Lasagna"
  };

  // Replace variables in content for preview
  const previewHtml = template.html_content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return sampleData[key as keyof typeof sampleData] || match;
  });

  const previewSubject = template.subject_template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return sampleData[key as keyof typeof sampleData] || match;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Preview: {template.template_name}</span>
            <Badge variant={template.is_active ? "default" : "secondary"}>
              {template.is_active ? "Active" : "Inactive"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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

          {template.text_content && (
            <div>
              <h4 className="font-medium mb-2">Text Content:</h4>
              <div className="p-3 bg-muted rounded border whitespace-pre-wrap text-sm">
                {template.text_content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                  return sampleData[key as keyof typeof sampleData] || match;
                })}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p><strong>Note:</strong> This preview uses sample data. Variables like {`{{order_number}}`}, {`{{customer_name}}`}, etc. will be replaced with actual data when emails are sent.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};