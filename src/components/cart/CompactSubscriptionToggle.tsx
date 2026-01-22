import React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Repeat } from "lucide-react";
import { useSubscriptionSettings } from "@/hooks/useSubscriptionSettings";

interface CompactSubscriptionToggleProps {
  isSubscription: boolean;
  onToggle: (enabled: boolean) => void;
}

const CompactSubscriptionToggle: React.FC<CompactSubscriptionToggleProps> = ({
  isSubscription,
  onToggle,
}) => {
  const { discountEnabled, discountPercentage, loading } = useSubscriptionSettings();
  
  return (
    <div className="border border-border/40 rounded-xl bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Repeat className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">Make this a weekly order</span>
              {!loading && discountEnabled && discountPercentage > 0 && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                  Save {discountPercentage}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cancel or pause anytime.
            </p>
          </div>
        </div>
        <Switch
          checked={isSubscription}
          onCheckedChange={onToggle}
          aria-label="Enable weekly subscription"
        />
      </div>
      
      {isSubscription && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Your meals will be delivered automatically every week. You can modify, skip, or cancel anytime from your account.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(CompactSubscriptionToggle);
