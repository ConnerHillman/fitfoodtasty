import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminTable } from "@/components/admin/common/AdminTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Eye, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { TemplateEditDialog } from "./TemplateEditDialog";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

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

export const OrderConfirmationManager = () => {
  const [editingTemplate, setEditingTemplate] = useState<OrderEmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OrderEmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['order-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_email_templates')
        .select('*')
        .eq('template_type', 'order_confirmation')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OrderEmailTemplate[];
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // If activating this template, first deactivate all others
      if (isActive) {
        await supabase
          .from('order_email_templates')
          .update({ is_active: false })
          .eq('template_type', 'order_confirmation');
      }

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
        description: "Email template status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template status.",
        variant: "destructive",
      });
      console.error('Error updating template:', error);
    }
  });

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

  const sendTestEmailMutation = useMutation({
    mutationFn: async (template: OrderEmailTemplate) => {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          template_id: template.id,
          template_type: 'order_confirmation',
          recipient_email: 'test@example.com'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Test email sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send test email.",
        variant: "destructive",
      });
      console.error('Error sending test email:', error);
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
      cell: ({ row }: any) => (
        <div className="max-w-[200px] truncate">
          {row.original.subject_template}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status", 
      accessorKey: "is_active",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Switch
            checked={row.original.is_active}
            onCheckedChange={(checked) => 
              toggleActiveMutation.mutate({ 
                id: row.original.id, 
                isActive: checked 
              })
            }
          />
          <Badge variant={row.original.is_active ? "default" : "secondary"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewTemplate(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingTemplate(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestEmailMutation.mutate(row.original)}
          >
            <TestTube className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Order Confirmation Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage templates sent to customers after order completion. Only one template can be active at a time.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <AdminTable
        title="Templates"
        data={templates}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search templates..."
      />

      <TemplateEditDialog
        template={editingTemplate}
        isOpen={!!editingTemplate || isCreateDialogOpen}
        onClose={() => {
          setEditingTemplate(null);
          setIsCreateDialogOpen(false);
        }}
        templateType="order_confirmation"
      />

      <TemplatePreviewDialog
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};