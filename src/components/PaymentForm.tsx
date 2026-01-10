import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface PaymentFormProps {
  clientSecret: string;
  totalAmount: number;
  deliveryMethod: string;
  requestedDeliveryDate: string;
  orderNotes?: string;
  onOrderNotesChange?: (notes: string) => void;
  adminOrderData?: any;
  customerName?: string;
  customerEmail?: string;
}

export default function PaymentForm({ 
  clientSecret, 
  totalAmount, 
  deliveryMethod, 
  requestedDeliveryDate,
  orderNotes: externalOrderNotes,
  onOrderNotesChange: externalOnOrderNotesChange,
  adminOrderData,
  customerName,
  customerEmail
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState(externalOrderNotes || "");
  const [saveCard, setSaveCard] = useState(true);

  // Update local state when external prop changes
  useEffect(() => {
    if (externalOrderNotes !== undefined) {
      setOrderNotes(externalOrderNotes);
    }
  }, [externalOrderNotes]);

  // Handle order notes change
  const handleOrderNotesChange = (notes: string) => {
    setOrderNotes(notes);
    if (externalOnOrderNotesChange) {
      externalOnOrderNotesChange(notes);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required"
      });

      if (error) {
        logger.error("Payment failed", error);
        toast({
          title: "Payment failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Payment succeeded - create order in database
      const paymentIntentId = clientSecret.split('_secret_')[0];
      
      const { data, error: orderError } = await supabase.functions.invoke('create-order-from-payment', {
        body: { 
          payment_intent_id: paymentIntentId,
          order_notes: orderNotes.trim() || null
        }
      });

      if (orderError) throw orderError;

      clearCart();
      toast({
        title: "Payment successful!",
        description: `Your ${deliveryMethod === "pickup" ? "collection" : "delivery"} is confirmed for ${new Date(requestedDeliveryDate + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}`,
      });
      
      // Navigate with order data in state
      navigate("/payment-success", { 
        state: { 
          orderData: data,
          deliveryMethod,
          requestedDeliveryDate 
        } 
      });
    } catch (paymentError: any) {
      logger.error("Payment or order creation failed", paymentError);
      toast({
        title: "Payment failed",
        description: paymentError?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            <h3 className="text-lg font-medium text-gray-700 mb-4">Add New Card</h3>
            
            <PaymentElement 
              options={{
                layout: {
                  type: 'tabs',
                  defaultCollapsed: false,
                  radios: true,
                  spacedAccordionItems: false
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto'
                }
              }}
            />
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="save-card" 
                checked={saveCard}
                onCheckedChange={(checked) => setSaveCard(checked as boolean)}
              />
              <Label htmlFor="save-card" className="text-sm text-gray-600">
                Save card for future use
              </Label>
            </div>
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

      {/* Order Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Order Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Type Order Notes here."
            value={orderNotes}
            onChange={(e) => handleOrderNotesChange(e.target.value)}
            className="min-h-[100px] resize-none"
          />
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
                COMPLETE ORDER
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
