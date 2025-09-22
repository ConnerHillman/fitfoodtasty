import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Calculator, User, Package, MapPin, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminFormModal } from "./common/AdminFormModal";

interface MealSelection {
  meal_id: string;
  meal_name: string;
  price: number;
  quantity: number;
}

interface ManualOrderData {
  customer_email: string;
  customer_name: string;
  delivery_address: string;
  order_type: 'phone' | 'complimentary' | 'special' | 'adjustment';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'complimentary' | 'stripe';
  order_notes: string;
  delivery_fee: number;
  discount_amount: number;
  meal_selections: MealSelection[];
  requested_delivery_date?: string;
}

interface ManualOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

export function ManualOrderModal({ open, onOpenChange, onOrderCreated }: ManualOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState<ManualOrderData>({
    customer_email: '',
    customer_name: '',
    delivery_address: '',
    order_type: 'phone',
    payment_method: 'card',
    order_notes: '',
    delivery_fee: 0,
    discount_amount: 0,
    meal_selections: [],
  });

  // Load meals and customers
  useEffect(() => {
    if (open) {
      loadMeals();
      loadCustomers();
    }
  }, [open]);

  const loadMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('id, name, price, is_active')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      toast.error('Failed to load meals');
      return;
    }
    
    setMeals(data || []);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, delivery_address')
      .order('full_name');
    
    if (error) {
      console.error('Failed to load customers:', error);
      return;
    }
    
    // For admin, we'll just use the profiles data without emails for now
    // In a real implementation, you'd need proper user management
    const customersData = data?.map(profile => ({
      user_id: profile.user_id,
      full_name: profile.full_name,
      delivery_address: profile.delivery_address,
      email: `customer-${profile.user_id.slice(0, 8)}@example.com` // Placeholder
    })) || [];
    
    setCustomers(customersData);
  };

  const addMealSelection = () => {
    setFormData(prev => ({
      ...prev,
      meal_selections: [...prev.meal_selections, {
        meal_id: '',
        meal_name: '',
        price: 0,
        quantity: 1
      }]
    }));
  };

  const updateMealSelection = (index: number, field: keyof MealSelection, value: any) => {
    setFormData(prev => ({
      ...prev,
      meal_selections: prev.meal_selections.map((selection, i) => {
        if (i === index) {
          if (field === 'meal_id') {
            const meal = meals.find(m => m.id === value);
            return {
              ...selection,
              meal_id: value,
              meal_name: meal?.name || '',
              price: meal?.price || 0
            };
          }
          return { ...selection, [field]: value };
        }
        return selection;
      })
    }));
  };

  const removeMealSelection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meal_selections: prev.meal_selections.filter((_, i) => i !== index)
    }));
  };

  const selectCustomer = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_email: customer.email,
      customer_name: customer.full_name,
      delivery_address: customer.delivery_address || ''
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.meal_selections.reduce((sum, selection) => 
      sum + (selection.price * selection.quantity), 0
    );
    const total = subtotal + formData.delivery_fee - formData.discount_amount;
    return { subtotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.meal_selections.length === 0) {
      toast.error('Please add at least one meal');
      return;
    }

    if (!formData.customer_name || !formData.customer_email) {
      toast.error('Please enter customer details');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-manual-order', {
        body: formData
      });

      if (error) throw error;

      toast.success('Manual order created successfully');
      onOrderCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        customer_email: '',
        customer_name: '',
        delivery_address: '',
        order_type: 'phone',
        payment_method: 'card',
        order_notes: '',
        delivery_fee: 0,
        discount_amount: 0,
        meal_selections: [],
      });
    } catch (error: any) {
      console.error('Error creating manual order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <AdminFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Manual Order"
      description="Create a new order manually for phone, complimentary, or special orders"
      size="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Customer Selection */}
            {customers.length > 0 && (
              <div>
                <Label>Select Existing Customer (Optional)</Label>
                <Select onValueChange={(value) => {
                  const customer = customers.find(c => c.user_id === value);
                  if (customer) selectCustomer(customer);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.user_id} value={customer.user_id}>
                        {customer.full_name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
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
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="delivery_address">Delivery Address</Label>
              <Textarea
                id="delivery_address"
                value={formData.delivery_address}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="order_type">Order Type</Label>
                <Select value={formData.order_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, order_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Order</SelectItem>
                    <SelectItem value="complimentary">Complimentary</SelectItem>
                    <SelectItem value="special">Special Request</SelectItem>
                    <SelectItem value="adjustment">Order Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card Payment</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="complimentary">Complimentary</SelectItem>
                    <SelectItem value="stripe">Stripe (Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="delivery_date">Delivery Date (Optional)</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.requested_delivery_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, requested_delivery_date: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Selections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Meal Selections
              </span>
              <Button type="button" onClick={addMealSelection} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Meal
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.meal_selections.map((selection, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Select
                    value={selection.meal_id}
                    onValueChange={(value) => updateMealSelection(index, 'meal_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {meals.map((meal) => (
                        <SelectItem key={meal.id} value={meal.id}>
                          {meal.name} - £{meal.price?.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    value={selection.quantity}
                    onChange={(e) => updateMealSelection(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="w-24 text-right font-medium">
                  £{(selection.price * selection.quantity).toFixed(2)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMealSelection(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {formData.meal_selections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No meals selected. Click "Add Meal" to start building the order.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_fee">Delivery Fee (£)</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="discount_amount">Discount Amount (£)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>£{formData.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-£{formData.discount_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Order Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.order_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, order_notes: e.target.value }))}
              placeholder="Add any special instructions, customer requests, or internal notes..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </AdminFormModal>
  );
}