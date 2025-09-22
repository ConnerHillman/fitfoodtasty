import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Users, AlertCircle, Truck, MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDeliveryLogic } from '@/hooks/useDeliveryLogic';

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
  delivery_method: 'delivery' | 'pickup';
  collection_point_id?: string;
  collection_point_name?: string;
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
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const { setAdminOrderData } = useCart();
  const navigate = useNavigate();
  
  // Debounce search to improve performance
  const debouncedSearch = useDebouncedValue(customerSearch, 300);

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
    delivery_method: 'delivery',
    collection_point_id: '',
    collection_point_name: '',
  });

  // Initialize delivery logic
  const {
    deliveryMethod,
    setDeliveryMethod,
    selectedCollectionPoint,
    setSelectedCollectionPoint,
    collectionPoints,
    deliveryFee: calculatedDeliveryFee,
    deliveryZone,
    manualPostcode,
    postcodeChecked,
    handlePostcodeChange,
    getCollectionFee,
  } = useDeliveryLogic();

  useEffect(() => {
    if (open) {
      loadCustomers();
      resetForm(); // Reset form when modal opens
    }
  }, [open]);

  const loadCustomers = async () => {
    setCustomersLoading(true);
    setError(null);
    setWarning(null);
    
    try {
      console.log('Loading customers via edge function...');
      const { data, error } = await supabase.functions.invoke('get-customers-for-admin');
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to fetch customers');
      }
      
      if (data?.warning) {
        setWarning(data.warning);
      }
      
      const customerList = data?.customers || [];
      console.log(`Loaded ${customerList.length} customers`);
      setCustomers(customerList);
      
    } catch (error: any) {
      console.error('Error loading customers:', error);
      setError(error.message || 'Failed to load customers');
      
      // Show toast for user feedback
      toast({
        title: "Error Loading Customers",
        description: error.message || "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setCustomersLoading(false);
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
    // Basic validation
    if (!formData.customer_name || !formData.customer_email) {
      toast({
        title: "Validation Error",
        description: "Please fill in customer name and email",
        variant: "destructive",
      });
      return;
    }

    // Delivery method specific validation
    if (deliveryMethod === 'delivery') {
      if (!formData.delivery_address) {
        toast({
          title: "Validation Error",
          description: "Delivery address is required for delivery orders",
          variant: "destructive",
        });
        return;
      }
      if (!manualPostcode) {
        toast({
          title: "Validation Error", 
          description: "Postcode is required for delivery orders",
          variant: "destructive",
        });
        return;
      }
      if (postcodeChecked && !deliveryZone) {
        toast({
          title: "Validation Error",
          description: "Delivery is not available for this postcode",
          variant: "destructive",
        });
        return;
      }
    } else if (deliveryMethod === 'pickup') {
      if (!selectedCollectionPoint) {
        toast({
          title: "Validation Error",
          description: "Collection point is required for collection orders",
          variant: "destructive",
        });
        return;
      }
    }

    // Get collection point details if selected
    const collectionPoint = collectionPoints.find(cp => cp.id === selectedCollectionPoint);
    
    // Calculate final delivery fee
    const finalDeliveryFee = deliveryMethod === 'delivery' 
      ? (deliveryZone?.delivery_fee || calculatedDeliveryFee)
      : getCollectionFee();

    // Set admin order data and navigate to menu
    setAdminOrderData?.({
      customerName: formData.customer_name,
      customerEmail: formData.customer_email,
      customerPhone: formData.customer_phone,
      deliveryAddress: deliveryMethod === 'delivery' ? formData.delivery_address : (collectionPoint?.address || ''),
      postcode: deliveryMethod === 'delivery' ? manualPostcode : (collectionPoint?.postcode || ''),
      orderType: formData.order_type,
      paymentMethod: formData.payment_method,
      orderNotes: formData.order_notes,
      deliveryFee: finalDeliveryFee,
      discountAmount: formData.discount_amount,
      deliveryMethod: deliveryMethod === 'pickup' ? 'collection' : 'delivery' as 'delivery' | 'collection', // Map pickup back to collection for consistency
      collectionPointId: deliveryMethod === 'pickup' ? selectedCollectionPoint : undefined,
      collectionPointName: deliveryMethod === 'pickup' ? collectionPoint?.point_name : undefined,
    } as any); // Temporary fix for TypeScript
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
      delivery_method: 'delivery',
      collection_point_id: '',
      collection_point_name: '',
    });
  };

  // Filter customers based on debounced search
  const filteredCustomers = customers.filter(customer => {
    const searchLower = debouncedSearch.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.postal_code?.toLowerCase().includes(searchLower)
    );
  });

  // Show recent customers when no search term
  const displayCustomers = debouncedSearch 
    ? filteredCustomers.slice(0, 8)  // Show up to 8 search results
    : customers.slice(0, 10);        // Show 10 most recent customers

  const clearForm = () => {
    resetForm();
    setCustomerSearch('');
  };

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
                <Users className="h-5 w-5" />
                Select Existing Customer
                {customers.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {customers.length} customers
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Label>Search Customers</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, email, phone, or postcode..."
                    className="pl-10"
                    disabled={customersLoading}
                  />
                  {customersLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>

              {/* Warning/Error Messages */}
              {warning && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{warning}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={loadCustomers}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Customer List */}
              {!customersLoading && !error && (
                <>
                  {!debouncedSearch && customers.length > 0 && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Recent customers (showing {Math.min(customers.length, 10)})
                    </div>
                  )}
                  
                  {debouncedSearch && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Found {filteredCustomers.length} customer(s) matching "{debouncedSearch}"
                    </div>
                  )}

                  {displayCustomers.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                      {displayCustomers.map((customer) => (
                        <div
                          key={customer.user_id}
                          className="p-3 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => {
                            selectCustomer(customer);
                            setCustomerSearch('');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{customer.full_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{customer.email}</span>
                                {!customer.email_verified && (
                                  <Badge variant="outline" className="text-xs">placeholder</Badge>
                                )}
                              </div>
                              {customer.phone && (
                                <div className="text-xs text-muted-foreground">{customer.phone}</div>
                              )}
                              {customer.postal_code && (
                                <div className="text-xs text-muted-foreground">{customer.postal_code}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {debouncedSearch ? 'No customers found matching your search' : 'No customers available'}
                    </div>
                  )}
                </>
              )}

              {/* Loading State */}
              {customersLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading customers...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Method Selection */}
          <Card className="bg-background border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery Method Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`p-3 border-2 rounded-lg text-left transition-colors ${
                    deliveryMethod === "delivery"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">Delivery</div>
                  <div className="text-sm text-muted-foreground">
                    {calculatedDeliveryFee > 0 ? `£${calculatedDeliveryFee.toFixed(2)}` : "Free"}
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`p-3 border-2 rounded-lg text-left transition-colors ${
                    deliveryMethod === "pickup"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">Collection</div>
                  <div className="text-sm text-muted-foreground">
                    {getCollectionFee() > 0 ? `£${getCollectionFee().toFixed(2)}` : "Free"}
                  </div>
                </button>
              </div>

              {/* Delivery-specific options */}
              {deliveryMethod === "delivery" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={manualPostcode}
                      onChange={(e) => handlePostcodeChange(e.target.value)}
                      placeholder="Enter postcode"
                      className="mt-1"
                    />
                  </div>
                  
                  {postcodeChecked && !deliveryZone && (
                    <div className="mt-2">
                      <Badge variant="destructive">
                        Delivery not available for this postcode
                      </Badge>
                    </div>
                  )}

                  {deliveryZone && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {deliveryZone.zone_name} - £{deliveryZone.delivery_fee?.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Collection-specific options */}
              {deliveryMethod === "pickup" && (
                <div>
                  <Label htmlFor="collection-point">Collection Point</Label>
                  <Select value={selectedCollectionPoint} onValueChange={setSelectedCollectionPoint}>
                    <SelectTrigger id="collection-point" className="mt-1">
                      <SelectValue placeholder="Select a collection point" />
                    </SelectTrigger>
                    <SelectContent>
                      {collectionPoints.map((point) => (
                        <SelectItem key={point.id} value={point.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{point.point_name}</span>
                            <span className="text-sm text-muted-foreground">{point.address}</span>
                            {point.collection_fee > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Fee: £{point.collection_fee.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Only show delivery address for delivery orders */}
              {deliveryMethod === "delivery" && (
                <div>
                  <Label htmlFor="delivery_address">Delivery Address *</Label>
                  <Textarea
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                    placeholder="Enter full delivery address"
                    rows={3}
                    required
                  />
                </div>
              )}
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

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearForm} size="sm">
              Clear Form
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Setting up...' : 'Continue to Menu'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};