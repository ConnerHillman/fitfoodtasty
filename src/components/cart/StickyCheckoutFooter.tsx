import React from "react";
import { Shield } from "lucide-react";

interface StickyCheckoutFooterProps {
  finalTotal: number;
  isEnabled: boolean;
  helperMessage: string;
  isLoading?: boolean;
  onClick?: () => void;
  itemCount?: number;
}

const StickyCheckoutFooter: React.FC<StickyCheckoutFooterProps> = ({
  finalTotal,
  isEnabled,
  helperMessage,
  itemCount = 0,
}) => {
  // This footer is now purely informational - scrolls user to payment section
  const scrollToPayment = () => {
    const paymentSection = document.querySelector('[data-payment-section="mobile"]');
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-sm border-t border-border/60 shadow-[0_-4px_20px_-4px_hsl(var(--foreground)_/_0.08)] safe-area-inset-bottom">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Total */}
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</span>
            <span className="text-2xl font-bold tracking-tight">£{finalTotal.toFixed(2)}</span>
          </div>
          
          {/* Right: Status or scroll CTA */}
          <div className="flex flex-col items-end">
            {!isEnabled ? (
              <span className="text-xs text-muted-foreground text-right max-w-[180px]">
                {helperMessage}
              </span>
            ) : (
              <button
                onClick={scrollToPayment}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Shield className="h-3.5 w-3.5" />
                Continue to payment ↓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StickyCheckoutFooter);
