import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, User, UserPlus, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

interface CustomerData {
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  postcode: string;
  create_account: boolean;
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
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const { setAdminOrderData } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CustomerData>({
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    postcode: '',
    create_account: false,
  });

  // Load customers when search changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setCustomers([]);
        setShowResults(false);
        return;
      }

      try {
        // Get profiles with user emails
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            full_name,
            phone,
            delivery_address,
            postal_code
          `)
          .or(`full_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%,postal_code.ilike.%${customerSearch}%`)
          .order('full_name')
          .limit(10);

        if (profilesError) throw profilesError;

        // Get auth users to get email addresses
        const userIds = profiles?.map(p => p.user_id) || [];
        if (userIds.length === 0) {
          setCustomers([]);
          setShowResults(true);
          return;
        }

        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Combine profiles with auth user data
        const customerList = profiles.map(profile => {
          const authUser = authUsers?.users?.find((user: any) => user.id === profile.user_id);
          return {
            ...profile,
            email: authUser?.email || '',
          };
        }).filter(customer =>
          customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
          customer.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
          customer.postal_code?.toLowerCase().includes(customerSearch.toLowerCase())
        );

        setCustomers(customerList);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomers([]);
        setShowResults(true);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.full_name,
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      delivery_address: customer.delivery_address || '',
      postcode: customer.postal_code || '',
      create_account: false, // Existing customer, don't create account
    }));
    setCustomerSearch(customer.full_name);
    setShowResults(false);
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
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.customer_email,
        password: Math.random().toString(36).slice(-12), // Random password
        email_confirm: true,
        user_metadata: {
          full_name: formData.customer_name,
          phone: formData.customer_phone,
          delivery_address: formData.delivery_address,
          postal_code: formData.postcode,
        }
      });

      if (authError) throw authError;

      // Profile will be created automatically via trigger
      toast({
        title: "Customer Account Created",
        description: `Account created for ${formData.customer_name}`,
      });

      return authData.user.id;
    } catch (error: any) {
      console.error('Error creating customer account:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create customer account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Validation
      if (!formData.customer_name || !formData.customer_email) {
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
      if (formData.create_account) {
        await createCustomerAccount();
      }

      // Detect delivery zone
      const deliveryZoneId = await detectDeliveryZone(formData.postcode);
      
      // Set admin order data and navigate to menu
      setAdminOrderData?.({
        customerName: formData.customer_name,
        customerEmail: formData.customer_email,
        customerPhone: formData.customer_phone,
        deliveryAddress: formData.delivery_address,
        postcode: formData.postcode,
        deliveryZoneId: deliveryZoneId,
        isNewAccount: formData.create_account,
      });

      onOpenChange(false);
      navigate('/menu?admin_order=true');
      
      toast({
        title: "Admin Mode Activated",
        description: `Creating order for ${formData.customer_name}. Select meals from the menu.`,
      });
    } catch (error) {
      // Error already handled in createCustomerAccount
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_email: '',
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      postcode: '',
      create_account: false,
    });
    setCustomerSearch('');
    setShowResults(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Manual Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Live Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Existing Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Search by name, email, phone, or postcode</Label>
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Start typing to search customers..."
                  className="w-full"
                />
              </div>
              
              {showResults && customerSearch.length >= 2 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <div
                        key={customer.user_id}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{customer.full_name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                            {customer.phone && (
                              <div className="text-sm text-muted-foreground">{customer.phone}</div>
                            )}
                          </div>
                          {customer.postal_code && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {customer.postal_code}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      No customers found. Enter details below to create a new order.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    placeholder="customer@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customer_phone">Phone Number</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
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
                <Label htmlFor="delivery_address">Delivery Address</Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder="Enter full delivery address"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_account"
                  checked={formData.create_account}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, create_account: checked as boolean }))
                  }
                />
                <Label htmlFor="create_account" className="text-sm">
                  Create customer account (they can log in later)
                </Label>
              </div>
            </CardContent>
          </Card>
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