import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminTable } from "@/components/admin/common/AdminTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Eye } from "lucide-react";
import { TemplateEditDialog } from "./TemplateEditDialog";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

interface WelcomeEmailTemplate {
  id: string;
  template_name: string;
  subject_template: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  is_default: boolean;
  template_type: string;
  variables?: any;
  created_at: string;
  updated_at: string;
}

export const WelcomeEmailsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<WelcomeEmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WelcomeEmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch welcome email templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['order-email-templates', 'welcome'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_email_templates')
        .select('*')
        .eq('template_type', 'welcome')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Toggle active mutation - ensures only one template is active
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        // First deactivate all other welcome templates
        const { error: deactivateError } = await supabase
          .from('order_email_templates')
          .update({ is_active: false })
          .eq('template_type', 'welcome')
          .neq('id', id);
        
        if (deactivateError) throw deactivateError;
      }

      // Then activate/deactivate this template
      const { error } = await supabase
        .from('order_email_templates')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-email-templates'] });
      toast({
        title: "Template updated",
        description: "Template status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template status.",
        variant: "destructive",
      });
      console.error('Error toggling template:', error);
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('order_email_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-email-templates'] });
      toast({
        title: "Template deleted",
        description: "Email template deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
      console.error('Error deleting template:', error);
    }
  });

  const columns = [
    {
      key: "template_name",
      header: "Template Name",
      accessorKey: "template_name",
    },
    { 
      key: "subject_template", 
      header: "Subject",
      accessorKey: "subject_template",
      cell: (value: string, item: WelcomeEmailTemplate) => (
        <div className="max-w-[200px] truncate">
          {item.subject_template}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status", 
      accessorKey: "is_active",
      cell: (value: boolean, item: WelcomeEmailTemplate) => (
        <div className="flex items-center space-x-2">
          <Switch
            checked={item.is_active}
            onCheckedChange={(checked) => 
              toggleActiveMutation.mutate({ 
                id: item.id, 
                isActive: checked 
              })
            }
          />
          <Badge variant={item.is_active ? "default" : "secondary"}>
            {item.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (value: any, item: WelcomeEmailTemplate) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewTemplate(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingTemplate(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Welcome Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage welcome email templates sent to new customers. Only one template can be active at a time.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      <AdminTable
        title="Welcome Email Templates"
        data={templates}
        columns={columns}
        loading={isLoading}
        actions={[
          {
            label: "Delete",
            onClick: (item) => deleteTemplateMutation.mutate(item.id),
            variant: "destructive" as const,
          }
        ]}
      />

      {/* Edit Dialog */}
      <TemplateEditDialog
        template={editingTemplate}
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        templateType="welcome"
      />

      {/* Create Dialog */}
      <TemplateEditDialog
        template={null}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        templateType="welcome"
      />

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};