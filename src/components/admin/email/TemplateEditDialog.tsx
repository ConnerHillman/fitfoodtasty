import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

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

interface TemplateEditDialogProps {
  template: OrderEmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  templateType: string;
}

export const TemplateEditDialog = ({ template, isOpen, onClose, templateType }: TemplateEditDialogProps) => {
  const [formData, setFormData] = useState({
    template_name: "",
    subject_template: "",
    html_content: "",
    text_content: "",
    is_active: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name,
        subject_template: template.subject_template,
        html_content: template.html_content,
        text_content: template.text_content || "",
        is_active: template.is_active,
      });
    } else {
      setFormData({
        template_name: "",
        subject_template: "",
        html_content: "",
        text_content: "",
        is_active: false,
      });
    }
  }, [template]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('order_email_templates')
          .update({
            template_name: data.template_name,
            subject_template: data.subject_template,
            html_content: data.html_content,
            text_content: data.text_content,
            is_active: data.is_active,
          })
          .eq('id', template.id);
        
        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('order_email_templates')
          .insert({
            template_name: data.template_name,
            subject_template: data.subject_template,
            html_content: data.html_content,
            text_content: data.text_content,
            is_active: data.is_active,
            template_type: templateType,
            is_default: false,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-email-templates'] });
      toast({
        title: template ? "Template updated" : "Template created",
        description: `Email template ${template ? 'updated' : 'created'} successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${template ? 'update' : 'create'} template.`,
        variant: "destructive",
      });
      console.error('Error saving template:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplateMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="e.g., Standard Order Confirmation"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject_template">Email Subject</Label>
              <Input
                id="subject_template"
                value={formData.subject_template}
                onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                placeholder="e.g., Order Confirmation #{{order_number}}"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="html_content">HTML Content</Label>
            <Textarea
              id="html_content"
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              placeholder="Enter HTML email content..."
              className="min-h-[200px] font-mono text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_content">Text Content (Optional)</Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              placeholder="Enter plain text email content..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Make this template active</Label>
            <p className="text-sm text-muted-foreground">
              (Only one template can be active at a time)
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending ? 'Saving...' : (template ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};