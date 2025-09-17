import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";

interface AuthErrorHandlerProps {
  error: string;
  isSignUp?: boolean;
}

export const AuthErrorHandler = ({ error, isSignUp = false }: AuthErrorHandlerProps) => {
  const getErrorMessage = (error: string) => {
    // Common signup errors
    if (error.includes("already registered") || error.includes("User already registered")) {
      return {
        title: "Account Already Exists",
        message: "This email is already registered. Try signing in instead, or use a different email address.",
        suggestion: "Switch to Sign In"
      };
    }
    
    if (error.includes("Password should be at least")) {
      return {
        title: "Password Too Short",
        message: "Your password must be at least 6 characters long.",
        suggestion: "Choose a stronger password"
      };
    }
    
    // Common signin errors
    if (error.includes("Invalid login credentials") || error.includes("Invalid credentials")) {
      return {
        title: "Sign In Failed",
        message: "The email or password you entered is incorrect. Please check your credentials and try again.",
        suggestion: "Double-check your email and password"
      };
    }
    
    if (error.includes("Email not confirmed")) {
      return {
        title: "Email Not Verified",
        message: "Please check your email and click the verification link before signing in.",
        suggestion: "Check your email inbox and spam folder"
      };
    }
    
    if (error.includes("User not found")) {
      return {
        title: "Account Not Found",
        message: isSignUp 
          ? "There was an issue creating your account. Please try again."
          : "No account found with this email address. Please check your email or create a new account.",
        suggestion: isSignUp ? "Try again" : "Create an account instead"
      };
    }
    
    if (error.includes("Too many requests")) {
      return {
        title: "Too Many Attempts",
        message: "Too many login attempts. Please wait a few minutes before trying again.",
        suggestion: "Wait a few minutes and try again"
      };
    }
    
    if (error.includes("Network")) {
      return {
        title: "Connection Issue",
        message: "There was a problem connecting to our servers. Please check your internet connection and try again.",
        suggestion: "Check your connection and retry"
      };
    }
    
    // Generic error fallback
    return {
      title: "Something Went Wrong",
      message: error || "An unexpected error occurred. Please try again.",
      suggestion: "Try again or contact support if the problem persists"
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          <p className="font-medium">{errorInfo.title}</p>
          <p className="text-sm">{errorInfo.message}</p>
          {errorInfo.suggestion && (
            <p className="text-xs text-muted-foreground italic">
              💡 {errorInfo.suggestion}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};