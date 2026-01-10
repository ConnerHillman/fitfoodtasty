import { useState } from "react";
import Handlebars from "handlebars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AuthEmailPreviewDialogProps {
  emailType: 'password_reset' | 'verification' | null;
  subject: string;
  htmlContent: string;
  isOpen: boolean;
  onClose: () => void;
}

// Sample data for auth email previews
const getAuthEmailSampleData = (type: 'password_reset' | 'verification') => ({
  // Customer info
  user_name: "Sarah Johnson",
  user_email: "sarah.johnson@example.com",
  customer_name: "Sarah Johnson",
  
  // Links
  reset_link: "https://fitfoodtasty.co.uk/reset-password?token=abc123xyz",
  verification_link: "https://fitfoodtasty.co.uk/verify?token=def456uvw",
  confirmation_link: "https://fitfoodtasty.co.uk/confirm?token=ghi789rst",
  
  // Business info
  company_name: "Fit Food Tasty",
  business_name: "Fit Food Tasty",
  business_phone: "07961 719602",
  website_url: "https://fitfoodtasty.co.uk",
  
  // Misc
  current_year: new Date().getFullYear(),
  expiry_hours: "24",
});

const getEmailTypeLabel = (type: 'password_reset' | 'verification') => {
  switch (type) {
    case 'password_reset':
      return 'Password Reset';
    case 'verification':
      return 'Email Verification';
    default:
      return type;
  }
};

export const AuthEmailPreviewDialog = ({ 
  emailType, 
  subject,
  htmlContent,
  isOpen, 
  onClose 
}: AuthEmailPreviewDialogProps) => {
  if (!emailType) return null;

  const sampleData = getAuthEmailSampleData(emailType);

  // Compile and render with Handlebars
  let previewHtml = "";
  let previewSubject = "";
  let compileError = "";

  try {
    if (htmlContent) {
      const compiledHtml = Handlebars.compile(htmlContent);
      previewHtml = compiledHtml(sampleData);
    }
    
    if (subject) {
      const compiledSubject = Handlebars.compile(subject);
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
            <span>Preview: Authentication Email</span>
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
            <p><strong>Note:</strong> This preview uses sample authentication data.</p>
            <p><strong>Sample User:</strong> {sampleData.user_name} ({sampleData.user_email})</p>
            <p className="pt-2"><strong>Available Variables:</strong></p>
            <code className="block bg-muted p-2 rounded text-xs">
              {emailType === 'password_reset' 
                ? `{{user_name}}, {{user_email}}, {{reset_link}}, {{company_name}}, {{business_name}}, {{website_url}}, {{expiry_hours}}, {{current_year}}`
                : `{{user_name}}, {{user_email}}, {{verification_link}}, {{confirmation_link}}, {{company_name}}, {{business_name}}, {{website_url}}, {{current_year}}`
              }
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
