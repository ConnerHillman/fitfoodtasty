import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Edit3 } from "lucide-react";
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
}) => {
  const { discountEnabled, discountPercentage, loading } = useSubscriptionSettings();
  if (items.length === 0) return null;

  // Calculate using admin overrides if in admin mode
  const adminCalculation = isAdminMode ? calculateAdminTotals(items, adminPriceOverrides) : null;
  const effectiveSubtotal = adminCalculation ? adminCalculation.subtotal : subtotal;
  
  // Calculate final total including fees
  const effectiveFinalTotal = isAdminMode ? effectiveSubtotal + fees : finalTotal;
  
  const subscriptionDiscount = (!loading && isSubscription && discountEnabled && discountPercentage > 0) 
    ? (effectiveSubtotal + fees) * (discountPercentage / 100) 
    : 0;
  const subscriptionTotal = isSubscription ? (effectiveSubtotal + fees) - subscriptionDiscount : effectiveFinalTotal;

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
          <span>£{subscriptionTotal.toFixed(2)}</span>
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