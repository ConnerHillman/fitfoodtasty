import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Search, User, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface CustomerData {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  postcode: string;
  createAccount: boolean;
}

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Customer {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  delivery_address?: string;
  postal_code?: string;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedSearchTerm = useDebouncedValue(customerSearch, 300);
  const { toast } = useToast();
  const { setAdminOrderData } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CustomerData>({
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    postcode: '',
    createAccount: false,
  });

  // Search for existing customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setCustomers([]);
        return;
      }

      try {
        setLoading(true);
        
        // Use the new RPC function for customer search
        const { data: customerData, error } = await supabase
          .rpc('search_customers', { search_term: debouncedSearchTerm });

        if (error) {
          console.error('Error searching customers:', error);
          toast({
            title: "Search Error",
            description: "Failed to search customers",
            variant: "destructive",
          });
          return;
        }

        setCustomers(customerData || []);
      } catch (error) {
        console.error('Error searching customers:', error);
        toast({
          title: "Search Error",
          description: "Failed to search customers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    searchCustomers();
  }, [debouncedSearchTerm, toast]);

  const selectCustomer = (customer: Customer) => {
    setFormData({
      customerName: customer.full_name || '',
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      deliveryAddress: customer.delivery_address || '',
      postcode: customer.postal_code || '',
      createAccount: false
    });
    setCustomerSearch('');
    setCustomers([]);
  };

  const detectDeliveryZone = async (postcode: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_delivery_zone_for_postcode', { customer_postcode: postcode });
      
      if (error) {
        console.error('Delivery zone detection error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error detecting delivery zone:', error);
      return null;
    }
  };

  const createCustomerAccount = async () => {
    if (!formData.customerEmail || !formData.customerName) {
      throw new Error('Customer email and name are required');
    }

    const { data, error } = await supabase.functions.invoke('admin-create-customer', {
      body: {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        postcode: formData.postcode
      }
    });

    if (error || !data?.success) {
      throw new Error(data?.error || 'Failed to create customer account');
    }

    return data.user_id;
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Validation
      if (!formData.customerName || !formData.customerEmail) {
        toast({
          title: "Validation Error",
          description: "Please fill in customer name and email",
          variant: "destructive",
        });
        return;
      }

      if (!formData.postcode) {
        toast({
          title: "Validation Error", 
          description: "Please enter a postcode for delivery validation",
          variant: "destructive",
        });
        return;
      }

      // Create customer account if requested
      if (formData.createAccount) {
        await createCustomerAccount();
      }

      // Detect delivery zone
      const deliveryZoneId = await detectDeliveryZone(formData.postcode);
      
      // Set admin order data and navigate to menu
      setAdminOrderData?.({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        postcode: formData.postcode,
        deliveryZoneId: deliveryZoneId,
        isNewAccount: formData.createAccount,
      });

      onOpenChange(false);
      navigate('/menu?admin_order=true');
      
      toast({
        title: "Admin Mode Activated",
        description: `Creating order for ${formData.customerName}. Select meals from the menu.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set up manual order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerEmail: '',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      postcode: '',
      createAccount: false,
    });
    setCustomerSearch('');
    setCustomers([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Order</DialogTitle>
          <DialogDescription>
            Search for an existing customer or create a new one to process a manual order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label htmlFor="customer-search">Search Existing Customers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer-search"
                placeholder="Search by name, email, phone, or postcode..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {customers.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                {customers.map((customer) => (
                  <div
                    key={customer.user_id} 
                    className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                    {customer.phone && (
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Details Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <User className="h-5 w-5" />
              Customer Details
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="customer@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                  placeholder="Enter postcode"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                placeholder="Enter full delivery address"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createAccount"
                checked={formData.createAccount}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, createAccount: checked as boolean }))
                }
              />
              <Label htmlFor="createAccount" className="text-sm">
                Create customer account (they can log in later)
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Setting up...' : 'Continue to Menu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};