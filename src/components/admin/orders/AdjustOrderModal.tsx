import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Edit3, Package, CreditCard, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  meal_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
  package_meal_selections?: any[];
  type: 'individual' | 'package';
  packages?: {
    name: string;
  };
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

  const handleSubmit = async () => {
    if (!order || !adjustmentReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the adjustment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('adjust-order', {
        body: {
          orderId: order.id,
          orderType: order.type || 'individual',
          adjustmentType,
          amount: adjustmentAmount,
          reason: adjustmentReason
        }
      });

      if (error) throw error;
      
      toast({
        title: "Order Adjusted",
        description: data.message || `Order ${order.id.slice(-8)} has been successfully adjusted.`,
      });
      
      onOrderUpdated();
      onClose();
      
      // Reset form
      setAdjustmentReason('');
      setAdjustmentAmount(0);
      setAdjustmentType('discount');
      
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
    onClose();
  };

  if (!order) return null;

  const newTotal = adjustmentType === 'fee' 
    ? order.total_amount + adjustmentAmount
    : order.total_amount - adjustmentAmount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Adjust Order #{order.id.slice(-8)}
          </DialogTitle>
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
                <span>Status:</span>
                <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Total:</span>
                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Adjustment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment-type">Adjustment Type</Label>
                <select
                  id="adjustment-type"
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'discount' | 'refund' | 'fee')}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="discount">Discount</option>
                  <option value="refund">Partial Refund</option>
                  <option value="fee">Additional Fee</option>
                </select>
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

              <div className="space-y-2">
                <Label htmlFor="adjustment-reason">Reason for Adjustment *</Label>
                <Textarea
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Please provide a detailed reason for this adjustment..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {adjustmentAmount > 0 && (
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
                      <div className="flex justify-between">
                        <span>{adjustmentType === 'fee' ? 'Additional Fee:' : 'Adjustment:'}</span>
                        <span className={adjustmentType === 'fee' ? 'text-red-600' : 'text-green-600'}>
                          {adjustmentType === 'fee' ? '+' : '-'}{formatCurrency(adjustmentAmount)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>New Total:</span>
                        <span>{formatCurrency(newTotal)}</span>
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
            disabled={isSubmitting || !adjustmentReason.trim() || adjustmentAmount <= 0}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Apply Adjustment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};