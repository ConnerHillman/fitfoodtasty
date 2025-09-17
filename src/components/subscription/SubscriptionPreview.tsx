import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, Clock, CheckCircle } from "lucide-react";
import type { CartItem } from "@/types/cart";

interface SubscriptionPreviewProps {
  items: CartItem[];
  deliveryFrequency: "weekly" | "bi-weekly" | "monthly";
  subscriptionDiscountAmount: number;
  nextDeliveryDate?: string;
  deliveryMethod: string;
  deliveryAddress?: string;
}

const SubscriptionPreview: React.FC<SubscriptionPreviewProps> = ({
  items,
  deliveryFrequency,
  subscriptionDiscountAmount,
  nextDeliveryDate,
  deliveryMethod,
  deliveryAddress,
}) => {
  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case "weekly": return "Every week";
      case "bi-weekly": return "Every 2 weeks";
      case "monthly": return "Every month";
      default: return frequency;
    }
  };

  const getDiscountPercentage = (frequency: string) => {
    switch (frequency) {
      case "weekly": return 5;
      case "bi-weekly": return 10;
      case "monthly": return 15;
      default: return 0;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Subscription Preview</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">
            {getDiscountPercentage(deliveryFrequency)}% savings
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Delivery Schedule */}
        <div className="p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Delivery Schedule</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frequency:</span>
              <span className="font-medium">{getFrequencyText(deliveryFrequency)}</span>
            </div>
            {nextDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next delivery:</span>
                <span className="font-medium">{nextDeliveryDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="font-medium capitalize">{deliveryMethod}</span>
            </div>
            {deliveryAddress && deliveryMethod === "delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium text-right max-w-32 truncate" title={deliveryAddress}>
                  {deliveryAddress}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Meal Contents */}
        <div className="p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Your Recurring Order</span>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="flex-1">
                  {item.name} {item.quantity > 1 && `× ${item.quantity}`}
                </span>
                <span className="text-muted-foreground">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            {subscriptionDiscountAmount > 0 && (
              <div className="flex justify-between items-center text-sm pt-2 border-t">
                <span className="text-green-600 font-medium">Subscription Savings:</span>
                <span className="text-green-600 font-medium">
                  -£{subscriptionDiscountAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-sm">Subscription Benefits</span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Automatic {getDiscountPercentage(deliveryFrequency)}% discount on every order</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Never run out of your favorite meals</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Change meals anytime before delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Cancel or pause subscription anytime</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPreview;