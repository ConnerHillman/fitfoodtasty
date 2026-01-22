import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";

interface StickyCheckoutFooterProps {
  finalTotal: number;
  isEnabled: boolean;
  helperMessage: string;
  isLoading?: boolean;
  onClick?: () => void;
}

const StickyCheckoutFooter: React.FC<StickyCheckoutFooterProps> = ({
  finalTotal,
  isEnabled,
  helperMessage,
  isLoading = false,
  onClick,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border/60 shadow-[0_-4px_20px_-4px_hsl(220_14%_10%_/_0.1)] safe-area-inset-bottom">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold">£{finalTotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end flex-1">
            <Button
              size="lg"
              className="w-full max-w-[220px] h-12 font-semibold text-base"
              disabled={!isEnabled || isLoading}
              onClick={onClick}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Continue to payment
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground mt-1 text-right">
              {helperMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StickyCheckoutFooter);
