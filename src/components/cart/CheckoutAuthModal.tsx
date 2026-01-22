import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";

// Google icon as inline SVG for brand accuracy
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface CheckoutAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "signin" | "signup";
}

type AuthView = "signin" | "signup" | "reset" | "reset-sent";

const CheckoutAuthModal: React.FC<CheckoutAuthModalProps> = ({
  open,
  onOpenChange,
  initialMode = "signin",
}) => {
  const isMobile = useIsMobile();
  const [view, setView] = useState<AuthView>(initialMode);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setView(initialMode);
      setError("");
    }
  }, [open, initialMode]);

  // UK phone validation
  const isValidUKPhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^(07\d{9}|0[12]\d{9}|447\d{9})$/.test(cleaned);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!firstName.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required");
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required for delivery communication");
      setLoading(false);
      return;
    }

    if (!isValidUKPhone(phone)) {
      setError("Please enter a valid UK phone number (e.g., 07123456789)");
      setLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/cart`;
    const fullName = `${firstName} ${lastName}`.trim();
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone: phone,
          delivery_address: deliveryAddress,
          city: city,
          postal_code: postalCode
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(signUpError.message);
      }
    } else {
      // Send welcome email
      supabase.functions.invoke('send-welcome-email', {
        body: { email, name: firstName }
      }).catch(err => console.error('Welcome email failed:', err));
      
      // Close modal - auth state will update automatically
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        setError(signInError.message);
      }
    } else {
      // Close modal - auth state will update automatically
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setView("reset-sent");
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setError("");
    
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent('/cart')}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setOauthLoading(false);
    }
  };

  const renderContent = () => {
    // Reset password sent view
    if (view === "reset-sent") {
      return (
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Check your email</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setView("signin")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
      );
    }

    // Reset password form
    if (view === "reset") {
      return (
        <div className="space-y-4 py-2">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <Button
            variant="link"
            onClick={() => { setView("signin"); setError(""); }}
            className="w-full text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sign In
          </Button>
        </div>
      );
    }

    // Sign in / Sign up forms
    return (
      <div className="space-y-4 py-2">
        {/* Cart preservation notice */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <ShoppingBag className="w-4 h-4 flex-shrink-0" />
          <span>Your cart is saved and ready to checkout</span>
        </div>

        {/* Google OAuth button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading || loading}
        >
          {oauthLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2">Continue with Google</span>
            </>
          )}
        </Button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        {/* Toggle between sign in and sign up */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === "signin" ? "default" : "outline"}
            className="flex-1"
            onClick={() => { setView("signin"); setError(""); }}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={view === "signup" ? "default" : "outline"}
            className="flex-1"
            onClick={() => { setView("signup"); setError(""); }}
          >
            Create Account
          </Button>
        </div>

        <form onSubmit={view === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">Password</Label>
              {view === "signin" && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => { setView("reset"); setError(""); }}
                  className="text-xs p-0 h-auto text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Button>
              )}
            </div>
            <Input
              id="auth-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {view === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="auth-firstName">First Name *</Label>
                  <Input
                    id="auth-firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-lastName">Last Name *</Label>
                  <Input
                    id="auth-lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-phone">Phone Number *</Label>
                <Input
                  id="auth-phone"
                  type="tel"
                  placeholder="e.g., 07123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Required for delivery updates</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-address">Delivery Address</Label>
                <Input
                  id="auth-address"
                  type="text"
                  placeholder="Enter your street address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="auth-city">City</Label>
                  <Input
                    id="auth-city"
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-postalCode">Postal Code</Label>
                  <Input
                    id="auth-postalCode"
                    type="text"
                    placeholder="Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {view === "signup" ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              view === "signup" ? "Create Account & Continue" : "Sign In & Continue"
            )}
          </Button>
        </form>
      </div>
    );
  };

  const title = view === "reset" || view === "reset-sent" 
    ? "Reset Password" 
    : "Continue to Checkout";
  
  const description = view === "reset" || view === "reset-sent"
    ? undefined
    : "Sign in or create an account to complete your order";

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {renderContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutAuthModal;
