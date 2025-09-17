import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
}

export const EmailVerificationBanner = ({ email, onDismiss }: EmailVerificationBannerProps) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    setIsResending(true);
    setResendError("");
    setResendSuccess(false);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setResendError(error.message);
    } else {
      setResendSuccess(true);
    }
    
    setIsResending(false);
  };

  return (
    <Alert className="border-primary bg-primary/5">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex-1">
        <div className="space-y-2">
          <p className="font-medium">Check your email to verify your account</p>
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to <strong>{email}</strong>. 
            Click the link in the email to complete your registration.
          </p>
          
          {resendSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Verification email sent successfully!</span>
            </div>
          )}
          
          {resendError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{resendError}</span>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending || resendSuccess}
            >
              {isResending ? "Sending..." : "Resend Email"}
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};