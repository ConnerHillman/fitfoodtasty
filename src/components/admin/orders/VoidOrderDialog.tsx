import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { X, AlertTriangle, Package, CreditCard } from 'lucide-react';
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
  type: 'individual' | 'package';
}

interface VoidOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderVoided: () => void;
}

export const VoidOrderDialog: React.FC<VoidOrderDialogProps> = ({
  isOpen,
  onClose,
  order,
  onOrderVoided
}) => {
  const { toast } = useToast();
  const [voidReason, setVoidReason] = useState('');
  const [processRefund, setProcessRefund] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order || !voidReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for voiding this order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('void-order', {
        body: {
          orderId: order.id,
          orderType: order.type || 'individual',
          reason: voidReason,
          processRefund,
          notifyCustomer
        }
      });

      if (error) throw error;
      
      toast({
        title: "Order Voided",
        description: data.message || `Order ${order.id.slice(-8)} has been voided successfully.`,
      });
      
      onOrderVoided();
      onClose();
      
      // Reset form
      setVoidReason('');
      setProcessRefund(false);
      setNotifyCustomer(true);
      
    } catch (error: any) {
      console.error('Error voiding order:', error);
      toast({
        title: "Void Failed",
        description: error.message || "Failed to void the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setVoidReason('');
    setProcessRefund(false);
    setNotifyCustomer(true);
    onClose();
  };

  if (!order) return null;

  const canProcessRefund = order.status === 'confirmed' || order.status === 'paid';
  const isAlreadyVoided = order.status === 'voided' || order.status === 'cancelled';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <X className="h-5 w-5" />
            Void Order #{order.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-destructive">Warning</h4>
              <p className="text-sm text-destructive/80 mt-1">
                This action will permanently void the order and cannot be undone. 
                The order will be marked as cancelled in the system.
              </p>
            </div>
          </div>

          {/* Order Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Customer:</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Amount:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Status:</span>
              <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Already Voided Check */}
          {isAlreadyVoided && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This order is already {order.status}. No further action is needed.
              </p>
            </div>
          )}

          {!isAlreadyVoided && (
            <>
              {/* Void Reason */}
              <div className="space-y-2">
                <Label htmlFor="void-reason">Reason for Voiding *</Label>
                <Textarea
                  id="void-reason"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Please provide a detailed reason for voiding this order..."
                  rows={3}
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                {canProcessRefund && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="process-refund"
                      checked={processRefund}
                      onCheckedChange={(checked) => setProcessRefund(checked === true)}
                    />
                    <Label htmlFor="process-refund" className="text-sm">
                      Process full refund ({formatCurrency(order.total_amount)})
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify-customer"
                    checked={notifyCustomer}
                    onCheckedChange={(checked) => setNotifyCustomer(checked === true)}
                  />
                  <Label htmlFor="notify-customer" className="text-sm">
                    Send cancellation notification to customer
                  </Label>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {!isAlreadyVoided && (
            <Button 
              variant="destructive"
              onClick={handleSubmit} 
              disabled={isSubmitting || !voidReason.trim()}
            >
              {isSubmitting ? "Processing..." : "Void Order"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};