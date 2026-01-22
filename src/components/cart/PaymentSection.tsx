import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ShoppingBag, Calendar, LogIn, UserPlus } from "lucide-react";
import PaymentForm from "@/components/PaymentForm";
import CheckoutAuthModal from "./CheckoutAuthModal";
interface PaymentSectionProps {
  user: any;
  clientSecret: string;
  finalTotal: number;
  deliveryMethod: "delivery" | "pickup";
  requestedDeliveryDate: Date | null;
  isCoupon100PercentOff: boolean;
  onCreateFreeOrder: () => Promise<void>;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  adminOrderData?: any;
  hasSelectedDate?: boolean;
  customerName?: string;
  customerEmail?: string;
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
  adminOrderData,
  hasSelectedDate = true,
  customerName,
  customerEmail,
}) => {
  const totalAmountInPence = Math.round(finalTotal * 100);


  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  if (!user) {
    return (
      <>
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
              <Button 
                className="flex-1 sm:flex-none"
                onClick={() => openAuthModal("signup")}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none"
                onClick={() => openAuthModal("signin")}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your cart will be saved
            </p>
          </CardContent>
        </Card>
        <CheckoutAuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          initialMode={authMode}
        />
      </>
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
            disabled={!hasSelectedDate}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {hasSelectedDate ? 'COMPLETE FREE ORDER' : 'SELECT A DATE TO CONTINUE'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    // Show date selection prompt if no date selected
    if (!hasSelectedDate) {
      return (
        <Card className="bg-background border border-border">
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-2">
              <Calendar className="h-12 w-12 mx-auto text-amber-500" />
              <h3 className="text-lg font-medium">Select a Date</h3>
              <p className="text-muted-foreground">
                Please select a {deliveryMethod === "pickup" ? "collection" : "delivery"} date above to continue with checkout
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show loading state if date is selected but payment intent is being created
    return (
      <Card className="bg-background border border-border">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Secure payment</h3>
            <p className="text-muted-foreground">Preparing your payment details...</p>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-1/2" />
          </div>
          <Button className="w-full h-12" size="lg" disabled>
            Pay now
          </Button>
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
        requestedDeliveryDate={requestedDeliveryDate?.toISOString().split('T')[0] || ''}
        orderNotes={orderNotes}
        onOrderNotesChange={onOrderNotesChange}
        adminOrderData={adminOrderData}
        customerName={customerName}
        customerEmail={customerEmail}
      />
    </Elements>
  );
};

export default React.memo(PaymentSection);