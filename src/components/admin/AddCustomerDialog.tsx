import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateCustomerData } from "@/lib/customerValidation";
import { UserPlus, User, Phone, MapPin, Mail } from "lucide-react";

interface AddCustomerDialogProps {
  onCustomerAdded: () => void;
}

interface CustomerFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  delivery_address: string;
  delivery_instructions: string;
  city: string;
  postal_code: string;
  county: string;
}

const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({ onCustomerAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    delivery_address: '',
    delivery_instructions: '',
    city: '',
    postal_code: '',
    county: '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      delivery_address: '',
      delivery_instructions: '',
      city: '',
      postal_code: '',
      county: '',
    });
  };

  // UK phone validation
  const isValidUKPhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^(07\d{9}|0[12]\d{9}|447\d{9})$/.test(cleaned);
  };

  const validateForm = (): boolean => {
    // Check phone is provided and valid
    if (!formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Phone number is required for delivery communication",
        variant: "destructive",
      });
      return false;
    }
    if (!isValidUKPhone(formData.phone)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid UK phone number (e.g., 07123456789)",
        variant: "destructive",
      });
      return false;
    }

    const validationResult = validateCustomerData({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      delivery_address: formData.delivery_address,
      city: formData.city,
      postal_code: formData.postal_code,
      county: formData.county,
      delivery_instructions: formData.delivery_instructions,
    });

    if (!validationResult.isValid) {
      // Show the first validation error
      const firstError = validationResult.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Validate and sanitize data
      const validationResult = validateCustomerData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        delivery_address: formData.delivery_address,
        city: formData.city,
        postal_code: formData.postal_code,
        county: formData.county,
        delivery_instructions: formData.delivery_instructions,
      });

      if (!validationResult.isValid || !validationResult.sanitizedData) {
        return; // validateForm should have already shown the error
      }

      const sanitizedData = validationResult.sanitizedData;

      // First, create an auth user with email and a temporary password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: Math.random().toString(36).slice(-12), // Generate random password
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: sanitizedData
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            title: "Error",
            description: "A customer with this email already exists",
            variant: "destructive",
          });
        } else {
          throw authError;
        }
        return;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create the profile manually since the trigger might not work for admin-created users
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: authData.user.id,
          full_name: `${sanitizedData.first_name} ${sanitizedData.last_name}`.trim(),
          first_name: sanitizedData.first_name,
          last_name: sanitizedData.last_name,
          phone: sanitizedData.phone || null,
          delivery_address: sanitizedData.delivery_address || null,
          delivery_instructions: sanitizedData.delivery_instructions || null,
          city: sanitizedData.city || null,
          postal_code: sanitizedData.postal_code || null,
          county: sanitizedData.county || null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue anyway as the profile might have been created by trigger
      }

      toast({
        title: "Success",
        description: `Customer ${sanitizedData.first_name} ${sanitizedData.last_name} has been added successfully`,
      });

      resetForm();
      setIsOpen(false);
      onCustomerAdded();

    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Create a new customer profile manually. An email invitation will be sent to the customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., 07123456789"
                  required
                />
                <p className="text-xs text-muted-foreground">Required for delivery updates</p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_address">Street Address</Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  placeholder="Enter full delivery address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                <Textarea
                  id="delivery_instructions"
                  value={formData.delivery_instructions}
                  onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                  placeholder="Special delivery instructions (e.g., gate code, building entrance, preferred delivery time)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="Postal code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={formData.county}
                    onChange={(e) => handleInputChange('county', e.target.value)}
                    placeholder="County"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;