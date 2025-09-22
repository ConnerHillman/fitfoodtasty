import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdminPaymentElementProps {
  clientSecret: string;
  totalAmount: number;
  deliveryMethod: string;
  requestedDeliveryDate: string;
  adminOrderData: NonNullable<ReturnType<typeof useCart>['adminOrderData']>;
  adminNotes: string;
}

export const AdminPaymentElement: React.FC<AdminPaymentElementProps> = ({
  clientSecret,
  totalAmount,
  deliveryMethod,
  requestedDeliveryDate,
  adminOrderData,
  adminNotes,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { clearCart, clearAdminOrderData, items } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: "if_required"
    });

    if (error) {
      console.error("Payment failed:", error);
      toast({
        title: "Payment failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } else {
      // Payment succeeded - create admin order in database
      try {
        const paymentIntentId = clientSecret.split('_secret_')[0];
        
        const { data, error } = await supabase.functions.invoke('create-manual-order', {
          body: {
            customer_email: adminOrderData.customerEmail,
            customer_name: adminOrderData.customerName,
            customer_phone: adminOrderData.customerPhone,
            delivery_address: adminOrderData.deliveryAddress,
            postcode: adminOrderData.postcode,
            order_type: adminOrderData.orderType,
            payment_method: 'card_at_checkout',
            order_notes: `${adminOrderData.orderNotes}\n\nAdmin Notes: ${adminNotes}`.trim(),
            delivery_fee: adminOrderData.deliveryFee,
            delivery_method: adminOrderData.deliveryMethod,
            collection_point_id: adminOrderData.collectionPointId,
            collection_point_name: adminOrderData.collectionPointName,
            requested_delivery_date: requestedDeliveryDate,
            meal_selections: items.map(item => ({
              meal_id: item.id,
              meal_name: item.name,
              price: item.price,
              quantity: item.quantity,
              type: item.type,
              packageData: item.packageData,
            })),
            payment_status: 'paid',
            payment_intent_id: paymentIntentId,
          }
        });

        if (error) throw error;

        clearCart();
        clearAdminOrderData?.();
        
        toast({
          title: "Payment successful!",
          description: `Admin order for ${adminOrderData.customerName} has been created and paid.`,
        });
        
        navigate("/payment-success");
      } catch (orderError) {
        console.error("Failed to create admin order:", orderError);
        toast({
          title: "Payment successful, but order creation failed",
          description: "Please contact support for assistance.",
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Card Payment</h3>
            
            <PaymentElement 
              options={{
                layout: {
                  type: 'tabs',
                  defaultCollapsed: false,
                  radios: true,
                  spacedAccordionItems: false
                },
                fields: {
                  billingDetails: 'never'
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto'
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery/Collection Info */}
      <Card>
        <CardContent className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-blue-800">
                {deliveryMethod === "pickup" ? "Collection" : "Delivery"} Date Selected
              </div>
              <div className="text-sm text-blue-700">
                {new Date(requestedDeliveryDate + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total and Checkout */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-gray-700">Total:</span>
            <span className="text-2xl font-bold text-gray-900">
              £{(totalAmount / 100).toFixed(2)}
            </span>
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full h-12 text-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white"
            size="lg"
            disabled={!stripe || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                COMPLETE ADMIN ORDER
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};