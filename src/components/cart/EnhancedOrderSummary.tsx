import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Pencil, RotateCcw, Shield, Lock } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionSettings";
import { calculateAdminTotals, type AdminPriceOverrides } from "@/lib/adminPriceCalculations";

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

  return (
    <Card className="bg-card border border-border/60 shadow-md sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {items.map((item) => {
            const calculation = adminCalculation?.itemCalculations.find(calc => calc.id === item.id);
            const effectivePrice = calculation?.currentPrice ?? item.price;
            const lineTotal = calculation?.lineTotal ?? (item.price * item.quantity);
            const isOverridden = calculation?.isOverridden ?? false;
            
            return (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="text-muted-foreground flex-shrink-0">× {item.quantity}</span>
                    )}
                    {isAdminMode && isOverridden && (
                      <Edit3 className="h-3 w-3 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                  {isAdminMode && isOverridden && (
                    <div className="text-xs text-muted-foreground">
                      <span className="line-through">£{item.price.toFixed(2)}</span> → £{effectivePrice.toFixed(2)}
                    </div>
                  )}
                </span>
                <span className="font-medium flex-shrink-0">£{lineTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <hr className="border-border/60" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
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
              <span>-£{((effectiveSubtotal + fees) * (discountPercentage / 100)).toFixed(2)}</span>
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
        </div>

        <hr className="border-border/60" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold">
            Total{isSubscription ? ' / week' : ''}
          </span>
          <div className="flex items-center gap-2">
            {isAdminMode && !isEditingTotal && (
              <>
                <span className={`text-2xl font-bold ${adminTotalOverride !== null ? "text-orange-600" : ""}`}>
                  £{subscriptionTotal.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditTotal}
                  title="Edit total"
                  className="h-6 w-6 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                {adminTotalOverride !== null && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResetTotal}
                    title="Reset to calculated total"
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
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
                  className="w-20 h-6 text-right text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveTotal} className="h-6 w-6 p-0 text-primary">
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0 text-destructive">
                  ✕
                </Button>
              </div>
            )}
            {!isAdminMode && (
              <span className="text-2xl font-bold">£{subscriptionTotal.toFixed(2)}</span>
            )}
          </div>
        </div>

        {expiryWarning && (
          <Badge variant="destructive" className="w-full justify-center text-xs">
            {expiryWarning}
          </Badge>
        )}

        {/* Reassurance line */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
          <Shield className="h-3 w-3" />
          <span>Secure checkout · No hidden fees</span>
        </div>

        {/* CTA helper message for desktop */}
        {showCta && (
          <div className="hidden lg:block pt-2">
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
