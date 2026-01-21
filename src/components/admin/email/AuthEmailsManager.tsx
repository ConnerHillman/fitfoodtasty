import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Shield, Eye, Save, Loader2 } from "lucide-react";
import { AuthEmailPreviewDialog } from "./AuthEmailPreviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AuthEmailTemplate {
  id: string;
  email_type: string;
  subject_template: string;
  html_content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AuthEmailsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");
  const [previewType, setPreviewType] = useState<'password_reset' | 'verification' | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  // Local state for form editing
  const [resetSubject, setResetSubject] = useState("");
  const [resetContent, setResetContent] = useState("");
  const [resetEnabled, setResetEnabled] = useState(true);
  
  const [verifySubject, setVerifySubject] = useState("");
  const [verifyContent, setVerifyContent] = useState("");
  const [verifyEnabled, setVerifyEnabled] = useState(true);

  // Fetch templates from database
  const { data: templates, isLoading } = useQuery({
    queryKey: ['auth-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_email_templates')
        .select('*')
        .order('email_type');
      
      if (error) throw error;
      return data as AuthEmailTemplate[];
    }
  });

  // Populate form when templates load
  useEffect(() => {
    if (templates) {
      const resetTemplate = templates.find(t => t.email_type === 'password_reset');
      const verifyTemplate = templates.find(t => t.email_type === 'email_verification');
      
      if (resetTemplate) {
        setResetSubject(resetTemplate.subject_template);
        setResetContent(resetTemplate.html_content);
        setResetEnabled(resetTemplate.is_active);
      }
      
      if (verifyTemplate) {
        setVerifySubject(verifyTemplate.subject_template);
        setVerifyContent(verifyTemplate.html_content);
        setVerifyEnabled(verifyTemplate.is_active);
      }
    }
  }, [templates]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ emailType, subject, content, isActive }: {
      emailType: string;
      subject: string;
      content: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from('auth_email_templates')
        .update({
          subject_template: subject,
          html_content: content,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('email_type', emailType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-email-templates'] });
      toast({
        title: "Template saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = (type: 'password_reset' | 'email_verification') => {
    if (type === 'password_reset') {
      saveMutation.mutate({
        emailType: 'password_reset',
        subject: resetSubject,
        content: resetContent,
        isActive: resetEnabled,
      });
    } else {
      saveMutation.mutate({
        emailType: 'email_verification',
        subject: verifySubject,
        content: verifyContent,
        isActive: verifyEnabled,
      });
    }
  };

  const handleTestEmail = async (type: 'password_reset' | 'email_verification') => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address for testing",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          email: testEmail,
          email_type: type,
          token: 'test-token-12345',
          user_metadata: {
            first_name: 'Test',
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `${type === 'password_reset' ? 'Password reset' : 'Email verification'} test sent to ${testEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send test email",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Authentication Emails</h3>
        <p className="text-sm text-muted-foreground">
          Manage password reset and email verification templates. These are sent via your branded email domain.
        </p>
      </div>

      <Tabs defaultValue="password-reset" className="space-y-4">
        <TabsList>
          <TabsTrigger value="password-reset" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Password Reset
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password-reset" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password Reset Emails
              </CardTitle>
              <CardDescription>
                Customize the email sent when users request a password reset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="password-reset-enabled">Enable Custom Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Use custom branded password reset emails
                  </p>
                </div>
                <Switch
                  id="password-reset-enabled"
                  checked={resetEnabled}
                  onCheckedChange={setResetEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-subject">Email Subject</Label>
                <Input
                  id="reset-subject"
                  placeholder="Reset your Fit Food Tasty password"
                  value={resetSubject}
                  onChange={(e) => setResetSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-content">Email Content (HTML)</Label>
                <Textarea
                  id="reset-content"
                  rows={12}
                  placeholder="Enter your password reset email HTML template..."
                  value={resetContent}
                  onChange={(e) => setResetContent(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{{customer_name}}"}, {"{{reset_url}}"}, {"{{#if has_customer_name}}"}...{"{{/if}}"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setPreviewType('password_reset')}
                  className="gap-1.5"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  onClick={() => handleSave('password_reset')}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Template
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Test Password Reset Email</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleTestEmail('password_reset')}
                    disabled={isSendingTest}
                  >
                    {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Test"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Verification
              </CardTitle>
              <CardDescription>
                Customize the email sent to verify new user email addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="verification-enabled">Enable Custom Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Use custom branded verification emails
                  </p>
                </div>
                <Switch
                  id="verification-enabled"
                  checked={verifyEnabled}
                  onCheckedChange={setVerifyEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-subject">Email Subject</Label>
                <Input
                  id="verify-subject"
                  placeholder="Verify your Fit Food Tasty email"
                  value={verifySubject}
                  onChange={(e) => setVerifySubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-content">Email Content (HTML)</Label>
                <Textarea
                  id="verify-content"
                  rows={12}
                  placeholder="Enter your verification email HTML template..."
                  value={verifyContent}
                  onChange={(e) => setVerifyContent(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{{customer_name}}"}, {"{{verification_url}}"}, {"{{#if has_customer_name}}"}...{"{{/if}}"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setPreviewType('verification')}
                  className="gap-1.5"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  onClick={() => handleSave('email_verification')}
                  disabled={saveMutation.isPending}
                  className="gap-1.5"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Template
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Test Verification Email</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleTestEmail('email_verification')}
                    disabled={isSendingTest}
                  >
                    {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Test"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <AuthEmailPreviewDialog
        emailType={previewType}
        subject={previewType === 'password_reset' ? resetSubject : verifySubject}
        htmlContent={previewType === 'password_reset' ? resetContent : verifyContent}
        isOpen={!!previewType}
        onClose={() => setPreviewType(null)}
      />
    </div>
  );
};
