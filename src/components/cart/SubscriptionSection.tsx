import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, RotateCcw, Star, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SubscriptionOnboarding from "@/components/subscription/SubscriptionOnboarding";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubscriptionSectionProps {
  isSubscriptionEnabled: boolean;
  onSubscriptionToggle: (enabled: boolean) => void;
  deliveryFrequency: "weekly" | "bi-weekly" | "monthly";
  onDeliveryFrequencyChange: (frequency: "weekly" | "bi-weekly" | "monthly") => void;
  disabled?: boolean;
  showOnboarding?: boolean;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  isSubscriptionEnabled,
  onSubscriptionToggle,
  deliveryFrequency,
  onDeliveryFrequencyChange,
  disabled = false,
  showOnboarding = false,
}) => {
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "weekly":
        return "Every Week";
      case "bi-weekly":
        return "Every 2 Weeks";
      case "monthly":
        return "Every Month";
      default:
        return frequency;
    }
  };

  const getFrequencyDiscount = (frequency: string) => {
    switch (frequency) {
      case "weekly":
        return "5% off each delivery";
      case "bi-weekly":
        return "10% off each delivery";
      case "monthly":
        return "15% off each delivery";
      default:
        return "";
    }
  };

  const handleSubscriptionToggle = (enabled: boolean) => {
    if (enabled && showOnboarding) {
      setShowOnboardingDialog(true);
    } else {
      onSubscriptionToggle(enabled);
    }
  };

  const handleOnboardingComplete = (preferences: any) => {
    console.log('Subscription preferences:', preferences);
    setShowOnboardingDialog(false);
    onSubscriptionToggle(true);
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingDialog(false);
    onSubscriptionToggle(true);
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Subscribe & Save</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          </div>
          <Switch
            checked={isSubscriptionEnabled}
            onCheckedChange={handleSubscriptionToggle}
            disabled={disabled}
          />
        </div>
        <CardDescription>
          Turn this order into a recurring subscription and save on every delivery!
        </CardDescription>
      </CardHeader>

      {isSubscriptionEnabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delivery-frequency" className="text-sm font-medium">
              Delivery Frequency
            </Label>
            <Select value={deliveryFrequency} onValueChange={onDeliveryFrequencyChange}>
              <SelectTrigger id="delivery-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Weekly</span>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      5% off
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="bi-weekly">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Bi-weekly (Every 2 weeks)</span>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      10% off
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="monthly">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Monthly</span>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      15% off
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-white rounded-lg border border-green-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Delivery Schedule:</span>
              <span className="text-green-600 font-medium">
                {getFrequencyLabel(deliveryFrequency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Subscription Discount:</span>
              <span className="text-green-600 font-medium">
                {getFrequencyDiscount(deliveryFrequency)}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Cancel or modify your subscription anytime</p>
            <p>• Same meal selection will be delivered each period</p>
            <p>• You can change meals in your subscription settings</p>
          </div>
        </CardContent>
      )}

      <Dialog open={showOnboardingDialog} onOpenChange={setShowOnboardingDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Preferences</DialogTitle>
          </DialogHeader>
          <SubscriptionOnboarding
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubscriptionSection;