import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Repeat, Truck, DollarSign } from "lucide-react";

interface SubscriptionToggleProps {
  isSubscription: boolean;
  onToggle: (enabled: boolean) => void;
}

const SubscriptionToggle: React.FC<SubscriptionToggleProps> = ({
  isSubscription,
  onToggle,
}) => {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Weekly Subscription
          </CardTitle>
          <Switch
            checked={isSubscription}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-3">
          Get the same delicious meals delivered automatically every week
        </p>
        
        {isSubscription && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Save 10% on every delivery</span>
              <Badge variant="secondary" className="text-xs">SAVE 10%</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>Automatic weekly delivery</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Repeat className="h-4 w-4 text-purple-600" />
              <span>Cancel or modify anytime</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionToggle;