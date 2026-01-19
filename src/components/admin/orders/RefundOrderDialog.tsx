import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id?: string;
  type: 'individual' | 'package';
}

interface RefundOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderRefunded: () => void;
}

export const RefundOrderDialog: React.FC<RefundOrderDialogProps> = ({
  isOpen,
  onClose,
  order,
  onOrderRefunded
}) => {
  const { toast } = useToast();
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [isPartialRefund, setIsPartialRefund] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order || !refundReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the refund.",
        variant: "destructive",
      });
      return;
    }

    if (refundAmount <= 0 || refundAmount > order.total_amount) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid refund amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          orderId: order.id,
          orderType: order.type || 'individual',
          amount: refundAmount,
          reason: refundReason,
          notifyCustomer
        }
      });

      if (error) throw error;
      
      toast({
        title: "Refund Processed",
        description: data.message || `Refund of ${formatCurrency(refundAmount)} has been processed for order ${order.id.slice(-8)}.`,
      });
      
      onOrderRefunded();
      onClose();
      
      // Reset form
      setRefundAmount(0);
      setRefundReason('');
      setIsPartialRefund(false);
      setNotifyCustomer(true);
      
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process the refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRefundAmount(0);
    setRefundReason('');
    setIsPartialRefund(false);
    setNotifyCustomer(true);
    onClose();
  };

  const handleFullRefund = () => {
    setRefundAmount(order?.total_amount || 0);
    setIsPartialRefund(false);
  };

  const handlePartialRefund = () => {
    setIsPartialRefund(true);
    setRefundAmount(0);
  };

  if (!order) return null;

  const canProcessRefund = order.status === 'confirmed' || order.status === 'paid' || order.status === 'delivered';
  const hasStripeSession = !!order.stripe_payment_intent_id;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Refund Order #{order.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Order Total:</span>
                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Method:</span>
                <span className="text-muted-foreground">
                  {hasStripeSession ? 'Stripe' : 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Refund Eligibility Check */}
          {!canProcessRefund && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Refund Not Available</h4>
                <p className="text-sm text-destructive/80 mt-1">
                  This order cannot be refunded due to its current status ({order.status}).
                </p>
              </div>
            </div>
          )}

          {!hasStripeSession && canProcessRefund && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800">Manual Refund Required</h4>
                <p className="text-sm text-orange-700 mt-1">
                  No payment session found. You may need to process this refund manually.
                </p>
              </div>
            </div>
          )}

          {canProcessRefund && (
            <>
              {/* Refund Type Selection */}
              <div className="space-y-3">
                <Label>Refund Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={!isPartialRefund ? "default" : "outline"}
                    size="sm"
                    onClick={handleFullRefund}
                    className="flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Full Refund
                  </Button>
                  <Button
                    variant={isPartialRefund ? "default" : "outline"}
                    size="sm"
                    onClick={handlePartialRefund}
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Partial Refund
                  </Button>
                </div>
              </div>

              {/* Refund Amount */}
              <div className="space-y-2">
                <Label htmlFor="refund-amount">
                  Refund Amount {isPartialRefund && '*'}
                </Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={order.total_amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={!isPartialRefund}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum refund: {formatCurrency(order.total_amount)}
                </p>
              </div>

              {/* Refund Reason */}
              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund *</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please provide a detailed reason for this refund..."
                  rows={3}
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify-customer"
                    checked={notifyCustomer}
                    onCheckedChange={(checked) => setNotifyCustomer(checked === true)}
                  />
                  <Label htmlFor="notify-customer" className="text-sm">
                    Send refund confirmation email to customer
                  </Label>
                </div>
              </div>

              {/* Refund Preview */}
              {refundAmount > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Refund Amount:</span>
                        <span className="font-medium text-blue-700">
                          {formatCurrency(refundAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Balance:</span>
                        <span className="font-medium">
                          {formatCurrency(order.total_amount - refundAmount)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {canProcessRefund && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !refundReason.trim() || refundAmount <= 0}
            >
              {isSubmitting ? "Processing..." : `Refund ${formatCurrency(refundAmount)}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};