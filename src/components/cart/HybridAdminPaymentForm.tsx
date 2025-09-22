import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, CreditCard, Banknote, Building, Gift, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { AdminPaymentElement } from './AdminPaymentElement';

interface HybridAdminPaymentFormProps {
  adminOrderData: NonNullable<ReturnType<typeof useCart>['adminOrderData']>;
  totalAmount: number;
  deliveryMethod: string;
  requestedDeliveryDate: Date | null;
  orderNotes: string;
}

export const HybridAdminPaymentForm: React.FC<HybridAdminPaymentFormProps> = ({
  adminOrderData,
  totalAmount,
  deliveryMethod,
  requestedDeliveryDate,
  orderNotes,
}) => {
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { items, clearCart, clearAdminOrderData } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      case 'complimentary': return <Gift className="h-4 w-4" />;
      case 'card_at_checkout': return <CreditCard className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleCreateManualOrder = async () => {
    if (adminOrderData.paymentMethod !== 'card_at_checkout' && !alreadyPaid && adminOrderData.paymentMethod !== 'complimentary') {
      toast({
        title: "Payment Confirmation Required",
        description: "Please confirm that payment has been received or use Card at Checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-manual-order', {
        body: {
          customer_email: adminOrderData.customerEmail,
          customer_name: adminOrderData.customerName,
          customer_phone: adminOrderData.customerPhone,
          delivery_address: adminOrderData.deliveryAddress,
          postcode: adminOrderData.postcode,
          order_type: adminOrderData.orderType,
          payment_method: adminOrderData.paymentMethod,
          order_notes: `${adminOrderData.orderNotes}\n\nAdmin Notes: ${adminNotes}`.trim(),
          delivery_fee: adminOrderData.deliveryFee,
          delivery_method: adminOrderData.deliveryMethod,
          collection_point_id: adminOrderData.collectionPointId,
          collection_point_name: adminOrderData.collectionPointName,
          requested_delivery_date: requestedDeliveryDate?.toISOString().split('T')[0],
          meal_selections: items.map(item => ({
            meal_id: item.id,
            meal_name: item.name,
            price: item.price,
            quantity: item.quantity,
            type: item.type,
            packageData: item.packageData,
          })),
          payment_status: alreadyPaid || adminOrderData.paymentMethod === 'complimentary' ? 'paid' : 'pending',
        }
      });

      if (error) throw error;

      toast({
        title: "Order Created Successfully",
        description: `Manual order for ${adminOrderData.customerName} has been created.`,
      });

      clearCart();
      clearAdminOrderData?.();
      navigate('/payment-success');
    } catch (error: any) {
      console.error('Error creating manual order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create manual order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentIntent = async () => {
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          items: items.map(item => ({
            name: item.name,
            amount: Math.round(item.price * 100), // Convert to pence
            quantity: item.quantity,
            description: item.description || '',
            meal_id: item.id,
          })),
          currency: 'gbp',
          delivery_fee: adminOrderData.deliveryFee > 0 ? Math.round(adminOrderData.deliveryFee * 100) : null,
          delivery_method: adminOrderData.deliveryMethod,
          customer_email: adminOrderData.customerEmail,
          customer_name: adminOrderData.customerName,
          requested_delivery_date: requestedDeliveryDate?.toISOString().split('T')[0],
          is_admin_order: true,
          admin_order_data: {
            customerName: adminOrderData.customerName,
            customerPhone: adminOrderData.customerPhone || '',
            deliveryAddress: adminOrderData.deliveryAddress,
            postcode: adminOrderData.postcode,
            orderType: adminOrderData.orderType,
            orderNotes: `${adminOrderData.orderNotes}\n\nAdmin Notes: ${adminNotes}`.trim(),
            collectionPointId: adminOrderData.collectionPointId || '',
            collectionPointName: adminOrderData.collectionPointName || '',
          }
        }
      });

      if (error) throw error;

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive",
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const isCardAtCheckout = adminOrderData.paymentMethod === 'card_at_checkout';
  const isComplimentary = adminOrderData.paymentMethod === 'complimentary';
  const showAlreadyPaid = !isCardAtCheckout && !isComplimentary;

  return (
    <div className="space-y-6">
      {/* Customer Info Summary */}
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium">{adminOrderData.customerName}</div>
            <div className="text-sm text-muted-foreground">{adminOrderData.customerEmail}</div>
            {adminOrderData.customerPhone && (
              <div className="text-sm text-muted-foreground">{adminOrderData.customerPhone}</div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <Badge variant="outline">{adminOrderData.orderType}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Payment:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {getPaymentIcon(adminOrderData.paymentMethod)}
                {adminOrderData.paymentMethod === 'card_at_checkout' ? 'Card at Checkout' : adminOrderData.paymentMethod}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Delivery Fee:</span>
              <span>£{adminOrderData.deliveryFee.toFixed(2)}</span>
            </div>
            {adminOrderData.deliveryMethod === 'collection' && adminOrderData.collectionPointName && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Collection Point:</span>
                <span className="text-sm">{adminOrderData.collectionPointName}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span>£{(totalAmount + adminOrderData.deliveryFee).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <div className="space-y-2">
        <Label htmlFor="admin_notes">Additional Admin Notes</Label>
        <Textarea
          id="admin_notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add any additional notes for this order..."
          rows={3}
        />
      </div>

      {/* Payment Confirmation for non-Stripe methods */}
      {showAlreadyPaid && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-3 flex-1">
                <div>
                  <h4 className="font-medium text-amber-900">Payment Confirmation Required</h4>
                  <p className="text-sm text-amber-700">
                    Please confirm that payment has been received via {adminOrderData.paymentMethod} before creating this order.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="already_paid" 
                    checked={alreadyPaid}
                    onCheckedChange={(checked) => setAlreadyPaid(checked as boolean)}
                  />
                  <Label htmlFor="already_paid" className="text-sm font-medium text-amber-900">
                    Payment has been received and confirmed
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {isCardAtCheckout ? (
        <>
          {!clientSecret ? (
            <Button 
              onClick={handleCreatePaymentIntent} 
              disabled={loadingPayment}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loadingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Preparing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          ) : (
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#0570de',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '2px',
                    borderRadius: '4px',
                  }
                }
              }}
            >
              <AdminPaymentElement
                clientSecret={clientSecret}
                totalAmount={Math.round((totalAmount + adminOrderData.deliveryFee) * 100)}
                deliveryMethod={deliveryMethod}
                requestedDeliveryDate={requestedDeliveryDate?.toISOString().split('T')[0] || ''}
                adminOrderData={adminOrderData}
                adminNotes={adminNotes}
              />
            </Elements>
          )}
        </>
      ) : (
        <Button 
          onClick={handleCreateManualOrder} 
          disabled={loading || (showAlreadyPaid && !alreadyPaid)}
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {loading ? (
            "Creating Order..."
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Create Manual Order
            </>
          )}
        </Button>
      )}
    </div>
  );
};