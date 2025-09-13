import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

interface PaymentFormProps {
  clientSecret: string;
  totalAmount: number;
  deliveryMethod: string;
  requestedDeliveryDate: string;
}

export default function PaymentForm({ 
  clientSecret, 
  totalAmount, 
  deliveryMethod, 
  requestedDeliveryDate 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { clearCart } = useCart();
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
      // Payment succeeded
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
      navigate("/payment-success");
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement 
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: true
              }
            }}
          />
          
          <div className="space-y-2">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="font-medium text-primary">
                {deliveryMethod === "pickup" ? "Collection" : "Delivery"} Date:
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(requestedDeliveryDate + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">
                Total: £{(totalAmount / 100).toFixed(2)}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!stripe || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay £${(totalAmount / 100).toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}