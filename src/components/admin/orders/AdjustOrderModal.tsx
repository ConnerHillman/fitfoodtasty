import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit3, Package, CreditCard, AlertTriangle, Save, Plus, Minus, ShoppingCart, CalendarIcon, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  meal_id?: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PackageMealSelection {
  id: string;
  meal_id: string;
  quantity: number;
  meals?: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  requested_delivery_date?: string;
  production_date?: string;
  order_items?: OrderItem[];
  package_meal_selections?: PackageMealSelection[];
  type: 'individual' | 'package';
  packages?: {
    name: string;
  };
}

interface Meal {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface MealModification {
  action: 'add' | 'remove' | 'update_quantity' | 'replace';
  mealId: string;
  quantity?: number;
  replacementMealId?: string;
  itemId?: string;
}

interface AdjustOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

export const AdjustOrderModal: React.FC<AdjustOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated
}) => {
  const { toast } = useToast();
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'discount' | 'refund' | 'fee'>('discount');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('financial');
  
  // Meal modification states
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [mealModifications, setMealModifications] = useState<MealModification[]>([]);
  const [selectedMealToAdd, setSelectedMealToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [currentItems, setCurrentItems] = useState<(OrderItem | PackageMealSelection)[]>([]);

  // Date modification states
  const [newDeliveryDate, setNewDeliveryDate] = useState<Date | undefined>();
  const [isDateChanged, setIsDateChanged] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchAvailableMeals();
      setCurrentItems(order.type === 'package' ? order.package_meal_selections || [] : order.order_items || []);
      
      // Initialize delivery date if order has one
      if (order.requested_delivery_date) {
        setNewDeliveryDate(new Date(order.requested_delivery_date));
      }
    }
  }, [isOpen, order]);

  const fetchAvailableMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name, price, category')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setAvailableMeals(data || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const addMealModification = () => {
    if (!selectedMealToAdd) return;
    
    const meal = availableMeals.find(m => m.id === selectedMealToAdd);
    if (!meal) return;

    setMealModifications(prev => [...prev, {
      action: 'add',
      mealId: selectedMealToAdd,
      quantity: quantityToAdd
    }]);

    // Add to current items for preview
    if (order?.type === 'package') {
      setCurrentItems(prev => [...prev, {
        id: 'temp-' + Date.now(),
        meal_id: selectedMealToAdd,
        quantity: quantityToAdd,
        meals: { name: meal.name, price: meal.price }
      } as PackageMealSelection]);
    } else {
      setCurrentItems(prev => [...prev, {
        id: 'temp-' + Date.now(),
        meal_id: selectedMealToAdd,
        meal_name: meal.name,
        quantity: quantityToAdd,
        unit_price: meal.price,
        total_price: meal.price * quantityToAdd
      } as OrderItem]);
    }

    setSelectedMealToAdd('');
    setQuantityToAdd(1);
  };

  const removeMealItem = (itemId: string) => {
    const isTemp = itemId.startsWith('temp-');
    
    if (isTemp) {
      // Remove from preview
      setCurrentItems(prev => prev.filter(item => item.id !== itemId));
      // Remove from modifications
      setMealModifications(prev => prev.filter(mod => 
        !(mod.action === 'add' && mod.mealId === currentItems.find(item => item.id === itemId)?.meal_id)
      ));
    } else {
      // Mark for removal
      setMealModifications(prev => [...prev, {
        action: 'remove',
        mealId: '',
        itemId
      }]);
      // Remove from preview
      setCurrentItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const isTemp = itemId.startsWith('temp-');
    
    if (isTemp) {
      // Update preview for temp items
      setCurrentItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, quantity: newQuantity };
          if ('unit_price' in updated) {
            updated.total_price = updated.unit_price * newQuantity;
          }
          return updated;
        }
        return item;
      }));
      
      // Update modification
      setMealModifications(prev => prev.map(mod => {
        if (mod.action === 'add' && mod.mealId === currentItems.find(item => item.id === itemId)?.meal_id) {
          return { ...mod, quantity: newQuantity };
        }
        return mod;
      }));
    } else {
      // Mark for quantity update
      setMealModifications(prev => {
        const existing = prev.find(mod => mod.action === 'update_quantity' && mod.itemId === itemId);
        if (existing) {
          return prev.map(mod => 
            mod.action === 'update_quantity' && mod.itemId === itemId 
              ? { ...mod, quantity: newQuantity }
              : mod
          );
        }
        return [...prev, {
          action: 'update_quantity',
          mealId: '',
          itemId,
          quantity: newQuantity
        }];
      });
      
      // Update preview
      setCurrentItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, quantity: newQuantity };
          if ('unit_price' in updated) {
            updated.total_price = updated.unit_price * newQuantity;
          }
          return updated;
        }
        return item;
      }));
    }
  };

  const calculateNewTotal = () => {
    if (!order) return 0;
    
    // Start with the original order total
    let newTotal = order.total_amount;
    
    // Only apply meal modifications to individual orders (not packages)
    if (order.type === 'individual' && mealModifications.length > 0) {
      // Calculate the difference from meal modifications
      const mealDelta = mealModifications.reduce((delta, mod) => {
        if (mod.action === 'add') {
          const meal = availableMeals.find(m => m.id === mod.mealId);
          if (meal) {
            return delta + (meal.price * (mod.quantity || 1));
          }
        } else if (mod.action === 'remove' && mod.itemId) {
          const item = (order.order_items || []).find(item => item.id === mod.itemId);
          if (item) {
            return delta - item.total_price;
          }
        } else if (mod.action === 'update_quantity' && mod.itemId) {
          const item = (order.order_items || []).find(item => item.id === mod.itemId);
          if (item && mod.quantity) {
            const newItemTotal = item.unit_price * mod.quantity;
            return delta + (newItemTotal - item.total_price);
          }
        }
        return delta;
      }, 0);
      
      newTotal += mealDelta;
    }

    // Apply financial adjustments
    if (adjustmentAmount > 0) {
      if (adjustmentType === 'discount' || adjustmentType === 'refund') {
        newTotal = Math.max(0, newTotal - adjustmentAmount);
      } else if (adjustmentType === 'fee') {
        newTotal = newTotal + adjustmentAmount;
      }
    }

    return newTotal;
  };

  const handleSubmit = async () => {
    const hasFinancialAdjustment = adjustmentAmount > 0;
    const hasMealModifications = mealModifications.length > 0;
    const hasDateChange = isDateChanged && newDeliveryDate;

    // Auto-fill reason for date-only changes if no reason provided
    let submissionReason = adjustmentReason.trim();
    if (!submissionReason && hasDateChange && !hasFinancialAdjustment && !hasMealModifications) {
      submissionReason = `Delivery date updated to ${newDeliveryDate ? format(newDeliveryDate, 'PPP') : 'new date'}`;
    }

    if (!submissionReason) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the adjustment.",
        variant: "destructive",
      });
      return;
    }

    if (!hasFinancialAdjustment && !hasMealModifications && !hasDateChange) {
      toast({
        title: "No Changes",
        description: "Please make at least one adjustment, meal modification, or date change.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const requestBody: any = {
        orderId: order.id,
        orderType: order.type || 'individual',
        reason: submissionReason
      };

      if (hasFinancialAdjustment) {
        requestBody.adjustmentType = adjustmentType;
        requestBody.amount = adjustmentAmount;
      }

      if (hasMealModifications) {
        requestBody.mealModifications = mealModifications;
      }

      if (hasDateChange && newDeliveryDate) {
        requestBody.newDeliveryDate = newDeliveryDate.toISOString();
      }

      const { data, error } = await supabase.functions.invoke('adjust-order', {
        body: requestBody
      });

      if (error) throw error;
      
      toast({
        title: "Order Adjusted",
        description: data.message || `Order ${order.id.slice(-8)} has been successfully updated.`,
      });
      
      onOrderUpdated();
      onClose();
      
      // Reset form
      setAdjustmentReason('');
      setAdjustmentAmount(0);
      setAdjustmentType('discount');
      setMealModifications([]);
      setActiveTab('financial');
      setNewDeliveryDate(undefined);
      setIsDateChanged(false);
      
    } catch (error: any) {
      console.error('Error adjusting order:', error);
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to adjust the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAdjustmentReason('');
    setAdjustmentAmount(0);
    setAdjustmentType('discount');
    setMealModifications([]);
    setActiveTab('financial');
    setNewDeliveryDate(undefined);
    setIsDateChanged(false);
    onClose();
  };

  if (!order) return null;

  const newTotal = calculateNewTotal();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Adjust Order #{order.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Modify order details including financial adjustments, meal selections, and delivery dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer:</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Type:</span>
                <Badge variant="outline">{order.type}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Date:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {order.requested_delivery_date 
                      ? format(new Date(order.requested_delivery_date), 'PPP')
                      : 'Not set'
                    }
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setActiveTab('delivery');
                      // Small delay to ensure tab content is rendered before focusing
                      setTimeout(() => {
                        const dateButton = document.querySelector('[data-testid="delivery-date-trigger"]');
                        if (dateButton instanceof HTMLElement) {
                          dateButton.focus();
                        }
                      }, 100);
                    }}
                    title="Edit delivery date"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Production Date:</span>
                <span className="font-medium">
                  {order.production_date 
                    ? format(new Date(order.production_date), 'PPP')
                    : 'Not set'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Original Total:</span>
                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="meals" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Meals
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Delivery Date
              </TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Financial Adjustment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adjustment-type">Adjustment Type</Label>
                    <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="refund">Partial Refund</SelectItem>
                        <SelectItem value="fee">Additional Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adjustment-amount">Amount ({adjustmentType === 'fee' ? 'Add' : 'Subtract'})</Label>
                    <Input
                      id="adjustment-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={adjustmentType === 'fee' ? undefined : order.total_amount}
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            {'meal_name' in item ? item.meal_name : item.meals?.name || 'Unknown Meal'}
                          </div>
                          {'unit_price' in item && (
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(item.unit_price)} each
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMealItem(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Meal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedMealToAdd} onValueChange={setSelectedMealToAdd}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a meal to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMeals.map((meal) => (
                          <SelectItem key={meal.id} value={meal.id}>
                            {meal.name} - {formatCurrency(meal.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={quantityToAdd}
                      onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button onClick={addMealModification} disabled={!selectedMealToAdd}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Current Delivery Date:</span>
                    <span className="font-medium">
                      {order.requested_delivery_date 
                        ? format(new Date(order.requested_delivery_date), 'PPP')
                        : 'Not set'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Production Date:</span>
                    <span className="font-medium">
                      {order.production_date 
                        ? format(new Date(order.production_date), 'PPP')
                        : 'Not set'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Change Delivery Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label>New Delivery Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          data-testid="delivery-date-trigger"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newDeliveryDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newDeliveryDate ? format(newDeliveryDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newDeliveryDate}
                          onSelect={(date) => {
                            setNewDeliveryDate(date);
                            setIsDateChanged(true);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {isDateChanged && newDeliveryDate && (
                      <div className="text-sm text-muted-foreground">
                        <p>Production will be scheduled for: {format(new Date(newDeliveryDate.getTime() - 2 * 24 * 60 * 60 * 1000), 'PPP')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Reason Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Adjustment Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Please provide a detailed reason for this adjustment..."
                  rows={3}
                />
                {isDateChanged && !mealModifications.length && adjustmentAmount === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Reason is optional for date-only changes - we'll auto-generate one if left empty.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {(adjustmentAmount > 0 || mealModifications.length > 0 || isDateChanged) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-800">Adjustment Preview</h4>
                    <div className="mt-2 space-y-1 text-sm text-orange-700">
                      <div className="flex justify-between">
                        <span>Original Total:</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                      </div>
                      {mealModifications.length > 0 && (
                        <div className="flex justify-between">
                          <span>Meal Modifications:</span>
                          <span>{mealModifications.length} change(s)</span>
                        </div>
                      )}
                      {isDateChanged && newDeliveryDate && (
                        <div className="flex justify-between">
                          <span>New Delivery Date:</span>
                          <span>{format(newDeliveryDate, 'PPP')}</span>
                        </div>
                      )}
                      {adjustmentAmount > 0 && (
                        <div className="flex justify-between">
                          <span>{adjustmentType === 'fee' ? 'Additional Fee:' : 'Adjustment:'}</span>
                          <span className={adjustmentType === 'fee' ? 'text-red-600' : 'text-green-600'}>
                            {adjustmentType === 'fee' ? '+' : '-'}{formatCurrency(adjustmentAmount)}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>New Total:</span>
                        <span>
                          {newTotal === order.total_amount ? (
                            <span>{formatCurrency(newTotal)} <span className="text-xs text-muted-foreground">(no change)</span></span>
                          ) : (
                            formatCurrency(newTotal)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (!adjustmentReason.trim() && !(isDateChanged && !mealModifications.length && adjustmentAmount === 0) && (adjustmentAmount <= 0 && mealModifications.length === 0 && !isDateChanged))}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};