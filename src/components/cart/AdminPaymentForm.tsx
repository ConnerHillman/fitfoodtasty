import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, CreditCard, Banknote, Building, Gift, CheckCircle } from 'lucide-react';

interface AdminPaymentFormProps {
  adminOrderData: NonNullable<ReturnType<typeof useCart>['adminOrderData']>;
  totalAmount: number;
  deliveryMethod: string;
  requestedDeliveryDate: Date | null;
  orderNotes: string;
}

export const AdminPaymentForm: React.FC<AdminPaymentFormProps> = ({
  adminOrderData,
  totalAmount,
  deliveryMethod,
  requestedDeliveryDate,
  orderNotes,
}) => {
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const { items, clearCart, clearAdminOrderData } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building className="h-4 w-4" />;
      case 'complimentary': return <Gift className="h-4 w-4" />;
      case 'stripe': return <CreditCard className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleCreateOrder = async () => {
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
        }
      });

      if (error) throw error;

      toast({
        title: "Order Created Successfully",
        description: `Manual order for ${adminOrderData.customerName} has been created.`,
      });

      // Clear cart and admin data
      clearCart();
      clearAdminOrderData?.();
      
      // Navigate to success page
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
                {adminOrderData.paymentMethod}
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

      {/* Action Button */}
      <Button 
        onClick={handleCreateOrder} 
        disabled={loading}
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
    </div>
  );
};