import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Pencil, RotateCcw, Shield, ChevronDown, ChevronUp } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionSettings";
import { calculateAdminTotals, type AdminPriceOverrides } from "@/lib/adminPriceCalculations";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EnhancedOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  fees: number;
  discountAmount: number;
  discountDisplay: string;
  giftCardAmount: number;
  finalTotal: number;
  expiryWarning?: string | null;
  isSubscription?: boolean;
  isAdminMode?: boolean;
  adminPriceOverrides?: AdminPriceOverrides;
  adminTotalOverride?: number | null;
  onAdminTotalChange?: (newTotal: number | null) => void;
  deliveryMethod: "delivery" | "pickup";
  // CTA props
  ctaEnabled: boolean;
  ctaHelperMessage: string;
  showCta?: boolean;
}

const EnhancedOrderSummary: React.FC<EnhancedOrderSummaryProps> = ({
  items,
  subtotal,
  fees,
  discountAmount,
  discountDisplay,
  giftCardAmount,
  finalTotal,
  expiryWarning,
  isSubscription = false,
  isAdminMode = false,
  adminPriceOverrides = {},
  adminTotalOverride,
  onAdminTotalChange,
  deliveryMethod,
  ctaEnabled,
  ctaHelperMessage,
  showCta = true,
}) => {
  const { discountEnabled, discountPercentage, loading } = useSubscriptionSettings();
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotalValue, setTempTotalValue] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  if (items.length === 0) return null;

  // Calculate using admin overrides if in admin mode
  const adminCalculation = isAdminMode ? calculateAdminTotals(items, adminPriceOverrides) : null;
  const effectiveSubtotal = adminCalculation ? adminCalculation.subtotal : subtotal;
  
  // In admin mode, use the unified total calculation
  let effectiveFinalTotal: number;
  if (isAdminMode) {
    const calculatedTotal = effectiveSubtotal + fees - discountAmount - giftCardAmount;
    effectiveFinalTotal = adminTotalOverride !== null ? adminTotalOverride : calculatedTotal;
  } else {
    effectiveFinalTotal = finalTotal;
  }
  
  const subscriptionDiscount = (!loading && isSubscription && discountEnabled && discountPercentage > 0) 
    ? (effectiveSubtotal + fees) * (discountPercentage / 100) 
    : 0;
  const subscriptionTotal = isSubscription ? (effectiveSubtotal + fees) - subscriptionDiscount : effectiveFinalTotal;

  // Admin total editing handlers
  const handleEditTotal = () => {
    setTempTotalValue(effectiveFinalTotal.toFixed(2));
    setIsEditingTotal(true);
  };

  const handleSaveTotal = () => {
    const newTotal = parseFloat(tempTotalValue);
    if (!isNaN(newTotal) && newTotal >= 0 && onAdminTotalChange) {
      onAdminTotalChange(newTotal);
    }
    setIsEditingTotal(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTotal(false);
    setTempTotalValue("");
  };

  const handleResetTotal = () => {
    if (onAdminTotalChange) {
      onAdminTotalChange(null);
    }
  };

  const feeLabel = deliveryMethod === "pickup" ? "Collection fee" : "Delivery fee";
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasDiscounts = discountAmount > 0 || giftCardAmount > 0 || (isSubscription && subscriptionDiscount > 0);

  return (
    <Card className="bg-card border border-border/60 shadow-md sticky top-24">
      <CardContent className="p-5 space-y-4">
        {/* Total - Hero section */}
        <div className="text-center pb-2">
          <div className="text-sm text-muted-foreground mb-1">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}{isSubscription ? ' / week' : ''}
          </div>
          <div className="flex items-center justify-center gap-2">
            {isAdminMode && !isEditingTotal && (
              <>
                <span className={`text-3xl font-bold tracking-tight ${adminTotalOverride !== null ? "text-warning" : ""}`}>
                  £{subscriptionTotal.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditTotal}
                  title="Edit total"
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {adminTotalOverride !== null && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResetTotal}
                    title="Reset to calculated total"
                    className="h-7 w-7 p-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
            {isAdminMode && isEditingTotal && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={tempTotalValue}
                  onChange={(e) => setTempTotalValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTotal();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="w-24 h-8 text-center text-lg font-bold"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveTotal} className="h-7 w-7 p-0 text-primary">
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 p-0 text-destructive">
                  ✕
                </Button>
              </div>
            )}
            {!isAdminMode && (
              <span className="text-3xl font-bold tracking-tight">£{subscriptionTotal.toFixed(2)}</span>
            )}
          </div>
          
          {hasDiscounts && (
            <div className="text-sm text-primary font-medium mt-1">
              You're saving £{(discountAmount + giftCardAmount + subscriptionDiscount).toFixed(2)}
            </div>
          )}
        </div>

        {expiryWarning && (
          <Badge variant="destructive" className="w-full justify-center text-xs">
            {expiryWarning}
          </Badge>
        )}

        {/* Collapsible price breakdown */}
        <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
              <span>View price breakdown</span>
              {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3 space-y-2 text-sm border-t border-border/40 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal{isAdminMode && adminCalculation?.hasOverrides ? ' (adjusted)' : ''}
                </span>
                <span>£{effectiveSubtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">{feeLabel}</span>
                <span>{fees > 0 ? `£${fees.toFixed(2)}` : 'Free'}</span>
              </div>

              {!loading && isSubscription && discountEnabled && discountPercentage > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Subscription ({discountPercentage}% off)</span>
                  <span>-£{subscriptionDiscount.toFixed(2)}</span>
                </div>
              )}
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>{discountDisplay}</span>
                  <span>-£{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {giftCardAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Gift card</span>
                  <span>-£{giftCardAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Admin item overrides display */}
              {isAdminMode && adminCalculation?.hasOverrides && (
                <div className="pt-2 border-t border-border/40 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Price adjustments:</div>
                  {adminCalculation.itemCalculations
                    .filter(calc => calc.isOverridden)
                    .map(calc => {
                      const item = items.find(i => i.id === calc.id);
                      return (
                        <div key={calc.id} className="flex justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Edit3 className="h-3 w-3 text-warning" />
                            {item?.name}
                          </span>
                          <span>
                            <span className="line-through text-muted-foreground">£{calc.originalPrice.toFixed(2)}</span>
                            {' → '}
                            <span className="text-warning">£{calc.currentPrice.toFixed(2)}</span>
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Reassurance */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secure checkout · No hidden fees</span>
        </div>

        {/* CTA helper message for desktop */}
        {showCta && (
          <div className="hidden lg:block">
            <p className="text-xs text-center text-muted-foreground">
              {ctaHelperMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(EnhancedOrderSummary);
