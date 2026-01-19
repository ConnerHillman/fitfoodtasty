import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminInlinePaymentFormProps {
  clientSecret: string;
  totalAmount: number;
  onPaymentSuccess: (paymentIntentId: string) => Promise<void>;
  saveCard: boolean;
  onSaveCardChange: (save: boolean) => void;
  customerName?: string;
  isLoading?: boolean;
}

// Inner form component that uses Stripe hooks
const PaymentFormInner: React.FC<AdminInlinePaymentFormProps> = ({
  totalAmount,
  onPaymentSuccess,
  saveCard,
  onSaveCardChange,
  customerName,
  isLoading: externalLoading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/admin?tab=orders`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Payment succeeded
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await onPaymentSuccess(result.paymentIntent.id);
      } else {
        setError('Payment requires additional verification. Please try a different payment method.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = !stripe || !elements || isProcessing || externalLoading || !isReady;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="text-sm font-medium text-foreground">
          Enter Card Details
        </div>
        
        <div className="border border-border rounded-lg p-4 bg-card">
          <PaymentElement 
            onReady={() => setIsReady(true)}
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
                radios: true,
                spacedAccordionItems: false,
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
            }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="save-card-admin"
            checked={saveCard}
            onCheckedChange={(checked) => onSaveCardChange(checked as boolean)}
          />
          <Label htmlFor="save-card-admin" className="text-sm text-muted-foreground cursor-pointer">
            Save card to {customerName ? `${customerName}'s` : "customer's"} account for future orders
          </Label>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isButtonDisabled}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        {isProcessing || externalLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Complete Order & Charge £{(totalAmount / 100).toFixed(2)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  );
};

// Wrapper component that provides Stripe context
export const AdminInlinePaymentForm: React.FC<AdminInlinePaymentFormProps> = (props) => {
  if (!props.clientSecret) {
    return (
      <div className="flex items-center justify-center p-6 border border-border rounded-lg bg-muted/50">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Preparing payment form...</span>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#16a34a',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default AdminInlinePaymentForm;
