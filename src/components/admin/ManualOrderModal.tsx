import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

interface CustomerData {
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  postcode: string;
  order_type: 'phone' | 'complimentary' | 'special' | 'adjustment';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'complimentary' | 'stripe';
  order_notes: string;
  delivery_fee: number;
  discount_amount: number;
}

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const { toast } = useToast();
  const { setAdminOrderData } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CustomerData>({
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    postcode: '',
    order_type: 'phone',
    payment_method: 'cash',
    order_notes: '',
    delivery_fee: 0,
    discount_amount: 0,
  });

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, delivery_address, city, postal_code')
        .order('full_name');

      if (error) throw error;
      
      // Create customer list with email placeholders
      const customerList = (data || []).map(profile => ({
        ...profile,
        email: `user_${profile.user_id.slice(0, 8)}@customer.local` // Placeholder email
      }));
      
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const selectCustomer = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.full_name,
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      delivery_address: customer.delivery_address || '',
      postcode: customer.postal_code || '',
    }));
  };

  const handleSubmit = async () => {
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

    // Set admin order data and navigate to menu
    setAdminOrderData?.({
      customerName: formData.customer_name,
      customerEmail: formData.customer_email,
      customerPhone: formData.customer_phone,
      deliveryAddress: formData.delivery_address,
      postcode: formData.postcode,
      orderType: formData.order_type,
      paymentMethod: formData.payment_method,
      orderNotes: formData.order_notes,
      deliveryFee: formData.delivery_fee,
      discountAmount: formData.discount_amount,
    });
    onOpenChange(false);
    navigate('/menu?admin_order=true');
    
    toast({
      title: "Admin Mode Active",
      description: `Creating order for ${formData.customer_name}. Select meals and packages from the menu.`,
    });
  };

  const resetForm = () => {
    setFormData({
      customer_email: '',
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      postcode: '',
      order_type: 'phone',
      payment_method: 'cash',
      order_notes: '',
      delivery_fee: 0,
      discount_amount: 0,
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Order - Customer Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select Existing Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Search Customers</Label>
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Type to search by name or email..."
                />
              </div>
              
              {customerSearch && filteredCustomers.length > 0 && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredCustomers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.user_id}
                      className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        selectCustomer(customer);
                        setCustomerSearch('');
                      }}
                    >
                      <div className="font-medium">{customer.full_name}</div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email *</Label>
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
                  <Label htmlFor="customer_phone">Phone</Label>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                    placeholder="Postcode for delivery"
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
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="order_type">Order Type</Label>
                  <Select 
                    value={formData.order_type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, order_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone Order</SelectItem>
                      <SelectItem value="complimentary">Complimentary</SelectItem>
                      <SelectItem value="special">Special Order</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="complimentary">Complimentary</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="delivery_fee">Delivery Fee (£)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="discount_amount">Discount (£)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="order_notes">Order Notes</Label>
                <Textarea
                  id="order_notes"
                  value={formData.order_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_notes: e.target.value }))}
                  placeholder="Add any special instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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