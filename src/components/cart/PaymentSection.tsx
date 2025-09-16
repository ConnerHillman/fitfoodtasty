import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { Link } from "react-router-dom";
import { ShoppingBag, User } from "lucide-react";
import PaymentForm from "@/components/PaymentForm";

interface PaymentSectionProps {
  user: any;
  clientSecret: string;
  finalTotal: number;
  deliveryMethod: "delivery" | "pickup";
  requestedDeliveryDate: string;
  isCoupon100PercentOff: boolean;
  onCreateFreeOrder: () => Promise<void>;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  user,
  clientSecret,
  finalTotal,
  deliveryMethod,
  requestedDeliveryDate,
  isCoupon100PercentOff,
  onCreateFreeOrder,
  orderNotes,
  onOrderNotesChange,
}) => {
  const totalAmountInPence = Math.round(finalTotal * 100);

  if (!user) {
    return (
      <Card className="bg-background border border-border">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Sign in to complete your order</h3>
            <p className="text-muted-foreground">
              Create an account or sign in to proceed with checkout
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="flex-1 sm:flex-none">
              <Link to="/auth?mode=signup">
                Create Account
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link to="/auth?mode=signin">
                Sign In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCoupon100PercentOff) {
    return (
      <Card className="bg-background border border-border">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <ShoppingBag className="h-12 w-12 mx-auto text-green-600" />
            <h3 className="text-lg font-medium">Your order is free!</h3>
            <p className="text-muted-foreground">
              Complete your order without payment
            </p>
          </div>
          <Button 
            onClick={onCreateFreeOrder}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            COMPLETE FREE ORDER
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="bg-background border border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please select a delivery date to continue
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
          }
        }
      }}
    >
      <PaymentForm
        clientSecret={clientSecret}
        totalAmount={totalAmountInPence}
        deliveryMethod={deliveryMethod}
        requestedDeliveryDate={requestedDeliveryDate}
        orderNotes={orderNotes}
        onOrderNotesChange={onOrderNotesChange}
      />
    </Elements>
  );
};

export default React.memo(PaymentSection);