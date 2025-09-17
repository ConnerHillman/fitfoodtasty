import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  fees: number;
  discountAmount: number;
  discountDisplay: string;
  giftCardAmount: number;
  finalTotal: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  isMobile: boolean;
  expiryWarning?: string | null;
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
}) => {
  if (items.length === 0) return null;

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
              <span className="text-lg font-bold">£{finalTotal.toFixed(2)}</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={`space-y-4 ${isMobile && !expanded ? 'hidden' : ''}`}>
        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="flex-1 pr-2">
                {item.name} {item.quantity > 1 && <span className="text-muted-foreground">× {item.quantity}</span>}
              </span>
              <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <hr className="border-border/60" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          
          {fees > 0 && (
            <div className="flex justify-between">
              <span>Delivery/Collection Fee</span>
              <span>£{fees.toFixed(2)}</span>
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
          <span>Total</span>
          <span>£{finalTotal.toFixed(2)}</span>
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