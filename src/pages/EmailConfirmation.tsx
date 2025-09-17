import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'signup') {
        setStatus('error');
        setError('Invalid confirmation link');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          throw error;
        }

        setStatus('success');
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Failed to confirm email');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const getContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-12 w-12 animate-spin text-primary" />,
          title: "Confirming your email...",
          description: "Please wait while we verify your account.",
          action: null
        };
      
      case 'success':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Email confirmed successfully!",
          description: "Your account has been verified. You'll be redirected to the home page shortly.",
          action: (
            <Button onClick={() => navigate('/')} className="mt-4">
              Continue to FIT FOOD TASTY
            </Button>
          )
        };
      
      case 'error':
        return {
          icon: <XCircle className="h-12 w-12 text-destructive" />,
          title: "Email confirmation failed",
          description: error || "There was a problem confirming your email. The link may be expired or invalid.",
          action: (
            <div className="space-y-2 mt-4">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Go to Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          )
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          <CardTitle className="text-2xl font-bold">
            {content.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {content.description}
          </p>
          {content.action}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;