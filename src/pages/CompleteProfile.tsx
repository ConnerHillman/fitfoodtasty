import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Profile completion page for OAuth users who need to add required fields.
 * Phone is required; address fields are optional but helpful.
 */
const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // UK phone validation
  const isValidUKPhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^(07\d{9}|0[12]\d{9}|447\d{9})$/.test(cleaned);
  };

  useEffect(() => {
    const loadExistingProfile = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        // Pre-fill from user metadata (OAuth data)
        const metadata = user.user_metadata || {};
        setFirstName(metadata.first_name || metadata.given_name || "");
        setLastName(metadata.last_name || metadata.family_name || "");

        // Check existing profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, delivery_address, city, postal_code")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          // If profile already has phone, redirect to menu
          if (profile.phone && profile.phone.trim().length > 0) {
            navigate("/menu");
            return;
          }
          
          // Pre-fill from existing profile data
          if (profile.first_name) setFirstName(profile.first_name);
          if (profile.last_name) setLastName(profile.last_name);
          if (profile.delivery_address) setDeliveryAddress(profile.delivery_address);
          if (profile.city) setCity(profile.city);
          if (profile.postal_code) setPostalCode(profile.postal_code);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingProfile();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate phone
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

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: fullName || null,
          phone: phone,
          delivery_address: deliveryAddress || null,
          city: city || null,
          postal_code: postalCode || null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user?.id);

      if (updateError) {
        throw updateError;
      }

      // Send welcome email for OAuth users
      supabase.functions.invoke('send-welcome-email', {
        body: { 
          email: user?.email,
          name: firstName || "there"
        }
      }).catch(err => console.error('Welcome email failed:', err));

      navigate("/menu");
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            We need a few more details to deliver your meals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 07123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required for delivery updates and communication
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                type="text"
                placeholder="Enter your street address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Continue to Menu"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
