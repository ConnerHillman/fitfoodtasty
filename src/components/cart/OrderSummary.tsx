import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Edit3, Pencil, RotateCcw } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionSettings";
import { calculateAdminTotals, type AdminPriceOverrides } from "@/lib/adminPriceCalculations";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  fees: number;
  discountAmount: number;
  discountDisplay: string;
  giftCardAmount: number;
  finalTotal: number;
  expanded: boolean;
  onToggleExpanded: (() => void) | undefined;
  isMobile: boolean;
  expiryWarning?: string | null;
  isSubscription?: boolean;
  isAdminMode?: boolean;
  adminPriceOverrides?: AdminPriceOverrides;
  // Admin total editing
  adminTotalOverride?: number | null;
  onAdminTotalChange?: (newTotal: number | null) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  fees,
  discountAmount,
  discountDisplay,
  giftCardAmount,
  finalTotal,
  expanded,
  onToggleExpanded,
  isMobile,
  expiryWarning,
  isSubscription = false,
  isAdminMode = false,
  adminPriceOverrides = {},
  adminTotalOverride,
  onAdminTotalChange,
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

  return (
    <Card className="bg-muted/30 border border-border/60">
      <CardHeader 
        className={`pb-3 ${isMobile ? 'cursor-pointer' : ''}`}
        onClick={isMobile ? onToggleExpanded : undefined}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
          {isMobile && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">£{subscriptionTotal.toFixed(2)}</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${isMobile && !expanded ? 'hidden' : ''}`}>
        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => {
            const calculation = adminCalculation?.itemCalculations.find(calc => calc.id === item.id);
            const effectivePrice = calculation?.currentPrice ?? item.price;
            const lineTotal = calculation?.lineTotal ?? (item.price * item.quantity);
            const isOverridden = calculation?.isOverridden ?? false;
            
            return (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    {item.name} {item.quantity > 1 && <span className="text-muted-foreground">× {item.quantity}</span>}
                    {isAdminMode && isOverridden && (
                      <Edit3 className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                  {isAdminMode && isOverridden && (
                    <div className="text-xs text-muted-foreground">
                      <span className="line-through">£{item.price.toFixed(2)}</span> → £{effectivePrice.toFixed(2)}
                    </div>
                  )}
                </span>
                <span className="font-medium">£{lineTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <hr className="border-border/60" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal{isAdminMode && adminCalculation?.hasOverrides ? ' (with adjustments)' : ''}</span>
            <span>£{effectiveSubtotal.toFixed(2)}</span>
          </div>
          
          {fees > 0 && (
            <div className="flex justify-between">
              <span>Delivery/Collection Fee</span>
              <span>£{fees.toFixed(2)}</span>
            </div>
          )}

          {!loading && isSubscription && discountEnabled && discountPercentage > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Subscription Discount ({discountPercentage}%)</span>
              <span>-£{((effectiveSubtotal + fees) * (discountPercentage / 100)).toFixed(2)}</span>
            </div>
          )}
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{discountDisplay}</span>
              <span>-£{discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {giftCardAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Gift Card Applied</span>
              <span>-£{giftCardAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <hr className="border-border/60" />

        <div className="flex justify-between items-center font-bold text-lg">
          <span>Total{isSubscription ? ' per week' : ''}</span>
          <div className="flex items-center gap-2">
            {isAdminMode && !isEditingTotal && (
              <>
                <span className={adminTotalOverride !== null ? "text-orange-600" : ""}>
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
                <Button size="sm" variant="ghost" onClick={handleSaveTotal} className="h-6 w-6 p-0 text-green-600">
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0 text-red-600">
                  ✕
                </Button>
              </div>
            )}
            {!isAdminMode && (
              <span>£{subscriptionTotal.toFixed(2)}</span>
            )}
          </div>
        </div>

        {expiryWarning && (
          <Badge variant="destructive" className="w-full justify-center text-xs">
            {expiryWarning}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(OrderSummary);