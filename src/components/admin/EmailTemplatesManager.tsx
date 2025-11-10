import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Send, Trash2, Plus, Eye } from "lucide-react";
import { SafeHtml } from "@/components/common/SafeHtml";

interface EmailTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_template: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  is_default: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export const EmailTemplatesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);

  // Fetch email templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  const handleTestEmail = async (template: EmailTemplate) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address for testing",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create test order data
      const testOrderData = {
        customer_name: "Test Customer",
        order_id: "TEST-12345",
        order_date: new Date().toLocaleDateString('en-GB'),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
        delivery_address: "123 Test Street, Test City, TC1 2ST",
        order_items: `
          <div class="item">
            <strong>Test Meal 1</strong> x 2
            <span style="float: right;">£15.00</span>
          </div>
          <div class="item">
            <strong>Test Meal 2</strong> x 1
            <span style="float: right;">£8.50</span>
          </div>
        `,
        order_items_text: "Test Meal 1 x 2 - £15.00\nTest Meal 2 x 1 - £8.50",
        total_amount: "23.50",
        order_notes: "This is a test email with sample order notes."
      };

      // Create a test order to send
      const { error } = await supabase.functions.invoke('send-order-confirmation', {
        body: {
          orderId: 'test-order-' + Date.now(),
          orderType: 'individual',
          templateId: template.id,
          customData: {
            ...testOrderData,
            recipient_email: testEmail
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    // Create preview data with sample values
    const sampleData = {
      customer_name: "John Smith",
      order_id: "ORD-12345",
      order_date: new Date().toLocaleDateString('en-GB'),
      delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      delivery_address: "123 Example Street, Sample City, SC1 2ST",
      order_items: `
        <div class="item">
          <strong>Chicken & Rice Bowl</strong> x 2
          <span style="float: right;">£15.00</span>
        </div>
        <div class="item">
          <strong>Salmon Salad</strong> x 1
          <span style="float: right;">£8.50</span>
        </div>
      `,
      total_amount: "23.50",
      order_notes: "Please leave at the front door"
    };

    // Replace template variables
    let htmlContent = template.html_content;
    let subject = template.subject_template;

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    // Handle conditional sections
    htmlContent = htmlContent.replace(/{{#if order_notes}}([\s\S]*?){{\/if}}/g, '$1');

    setPreviewData({ subject, htmlContent, template });
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      let result;
      
      if (selectedTemplate?.id) {
        // Update existing template
        result = await supabase
          .from('order_email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);
      } else {
        // Create new template
        result = await supabase
          .from('order_email_templates')
          .insert(templateData);
      }

      if (result.error) throw result.error;

      await queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setIsEditing(false);
      setSelectedTemplate(null);

      toast({
        title: "Success",
        description: selectedTemplate?.id ? "Template updated successfully" : "Template created successfully",
      });
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('order_email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading email templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button
          onClick={() => {
            setSelectedTemplate(null);
            setIsEditing(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Subject: {template.subject_template}
                  </p>
                </div>
                <div className="flex gap-2">
                  {template.is_default && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  {template.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>

              <div className="flex gap-2 items-center">
                <Input
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => handleTestEmail(template)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      {previewData && (
        <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Preview: {previewData.template.template_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Subject:</Label>
                <p className="text-sm text-muted-foreground">{previewData.subject}</p>
              </div>
              <div>
                <Label className="font-semibold">Email Content:</Label>
                <SafeHtml 
                  html={previewData.htmlContent}
                  className="border rounded-lg p-4 mt-2 bg-background"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit/Create Template Dialog */}
      {isEditing && (
        <TemplateEditDialog
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onClose={() => {
            setIsEditing(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

interface TemplateEditDialogProps {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onClose: () => void;
}

const TemplateEditDialog = ({ template, onSave, onClose }: TemplateEditDialogProps) => {
  const [formData, setFormData] = useState({
    template_name: template?.template_name || "",
    template_type: template?.template_type || "order_confirmation",
    subject_template: template?.subject_template || "",
    html_content: template?.html_content || "",
    text_content: template?.text_content || "",
    is_active: template?.is_active ?? true,
    is_default: template?.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="template_type">Template Type</Label>
              <Input
                id="template_type"
                value={formData.template_type}
                onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject_template">Subject Template</Label>
            <Input
              id="subject_template"
              value={formData.subject_template}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
              placeholder="Order Confirmation #{{order_id}}"
              required
            />
          </div>

          <div>
            <Label htmlFor="html_content">HTML Content</Label>
            <Textarea
              id="html_content"
              value={formData.html_content}
              onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
              rows={15}
              className="font-mono text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="text_content">Text Content (Optional)</Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              />
              <span>Set as Default</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? "Update" : "Create"} Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};