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
import { Search, Loader2, Users, AlertCircle, Truck, MapPin, X, UserPlus } from 'lucide-react';
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
  order_type: 'phone' | 'complimentary' | 'special' | 'adjustment';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'complimentary' | 'stripe';
  order_notes: string;
}

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ open, onOpenChange }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const { toast } = useToast();
  const { setAdminOrderData } = useCart();
  const navigate = useNavigate();
  
  // Debounce search to improve performance
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const [formData, setFormData] = useState<CustomerData>({
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    order_type: 'phone',
    payment_method: 'stripe',
    order_notes: '',
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
      
      setCustomers(data?.customers || []);
      console.log(`Loaded ${data?.customers?.length || 0} customers`);
      
    } catch (error: any) {
      console.error('Error loading customers:', error);
      setError(error.message);
      setCustomers([]);
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
    }));
    
    // Update delivery logic with customer postcode
    if (customer.postal_code) {
      handlePostcodeChange(customer.postal_code);
    }
    
    setSearchInput('');
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
      deliveryMethod: deliveryMethod === 'pickup' ? 'collection' : 'delivery',
      collectionPointId: deliveryMethod === 'pickup' ? selectedCollectionPoint : undefined,
      collectionPointName: deliveryMethod === 'pickup' ? collectionPoint?.point_name : undefined,
    });

    onOpenChange(false);
    navigate('/menu');
    
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
      order_type: 'phone',
      payment_method: 'stripe',
      order_notes: '',
    });
    setSearchInput('');
    setError('');
    setWarning('');
    setDeliveryMethod('delivery');
    setSelectedCollectionPoint('');
    handlePostcodeChange('');
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Search & Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search customers by name, email, phone, or postcode..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Error and Warning Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {warning && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700">{warning}</span>
                </div>
              )}

              {/* Customer List */}
              {customersLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading customers...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {!debouncedSearch && (
                    <p className="text-xs text-muted-foreground mb-2">Recent customers:</p>
                  )}
                  {displayCustomers.length > 0 ? (
                    displayCustomers.map((customer, index) => (
                      <div
                        key={customer.user_id || index}
                        onClick={() => selectCustomer(customer)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{customer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            {customer.phone && (
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {customer.total_orders > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {customer.total_orders} orders
                              </Badge>
                            )}
                            {customer.postal_code && (
                              <p className="text-xs text-muted-foreground mt-1">{customer.postal_code}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : debouncedSearch ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No customers found matching "{debouncedSearch}"
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No customers found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Setup - Single Merged Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Order Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Customer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Enter customer name"
                      required
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
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_phone">Phone</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Delivery Method */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Delivery Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("delivery")}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      deliveryMethod === "delivery"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">Delivery</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {calculatedDeliveryFee > 0 ? `£${calculatedDeliveryFee.toFixed(2)}` : "Free"}
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      deliveryMethod === "pickup"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Collection</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getCollectionFee() > 0 ? `£${getCollectionFee().toFixed(2)}` : "Free"}
                    </div>
                  </button>
                </div>

                {/* Delivery-specific options */}
                {deliveryMethod === "delivery" && (
                  <div className="space-y-3 border-l-2 border-primary/20 pl-4">
                    <div>
                      <Label htmlFor="postcode">Postcode *</Label>
                      <Input
                        id="postcode"
                        value={manualPostcode}
                        onChange={(e) => handlePostcodeChange(e.target.value)}
                        placeholder="Enter postcode"
                        required
                      />
                    </div>
                    
                    {postcodeChecked && !deliveryZone && (
                      <Badge variant="destructive">
                        Delivery not available for this postcode
                      </Badge>
                    )}

                    {deliveryZone && (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <MapPin className="h-3 w-3" />
                        {deliveryZone.zone_name} - £{deliveryZone.delivery_fee?.toFixed(2)}
                      </Badge>
                    )}

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
                  </div>
                )}

                {/* Collection-specific options */}
                {deliveryMethod === "pickup" && (
                  <div className="border-l-2 border-primary/20 pl-4">
                    <Label htmlFor="collection-point">Collection Point *</Label>
                    <Select value={selectedCollectionPoint} onValueChange={setSelectedCollectionPoint} required>
                      <SelectTrigger>
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
              </div>

              {/* Order Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Order Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="complimentary">Complimentary</SelectItem>
                      </SelectContent>
                    </Select>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={clearForm} size="sm">
            Clear Form
          </Button>
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

export default ManualOrderModal;