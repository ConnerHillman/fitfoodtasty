import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, MapPin, AlertCircle, Check } from "lucide-react";
import CollectionPointPicker from "@/components/cart/CollectionPointPicker";
import type { DeliveryZone } from "@/types/fulfillment";
import { cn } from "@/lib/utils";

interface EnhancedDeliveryOptionsProps {
  deliveryMethod: "delivery" | "pickup";
  onDeliveryMethodChange: (method: "delivery" | "pickup") => void;
  selectedCollectionPoint: string;
  onCollectionPointChange: (point: string) => void;
  collectionPoints: any[];
  manualPostcode: string;
  onPostcodeChange: (postcode: string) => void;
  deliveryZone: DeliveryZone | null;
  postcodeChecked: boolean;
  deliveryFee: number;
  getCollectionFee: () => number;
}

const EnhancedDeliveryOptions: React.FC<EnhancedDeliveryOptionsProps> = ({
  deliveryMethod,
  onDeliveryMethodChange,
  selectedCollectionPoint,
  onCollectionPointChange,
  collectionPoints,
  manualPostcode,
  onPostcodeChange,
  deliveryZone,
  postcodeChecked,
  deliveryFee,
  getCollectionFee,
}) => {
  const collectionFee = getCollectionFee();

  return (
    <div className="space-y-4">
      {/* Method Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onDeliveryMethodChange("delivery")}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            deliveryMethod === "delivery"
              ? "border-primary bg-primary/5"
              : "border-border/60 hover:border-border"
          )}
        >
          {deliveryMethod === "delivery" && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          <Truck className={cn(
            "h-6 w-6",
            deliveryMethod === "delivery" ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="text-center">
            <p className={cn(
              "font-medium text-sm",
              deliveryMethod === "delivery" ? "text-primary" : "text-foreground"
            )}>
              Delivery
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Delivered to your address
            </p>
          </div>
          <span className={cn(
            "text-xs font-medium mt-1",
            deliveryMethod === "delivery" ? "text-primary" : "text-muted-foreground"
          )}>
            {deliveryFee > 0 ? `+£${deliveryFee.toFixed(2)}` : 'Free'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDeliveryMethodChange("pickup")}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            deliveryMethod === "pickup"
              ? "border-primary bg-primary/5"
              : "border-border/60 hover:border-border"
          )}
        >
          {deliveryMethod === "pickup" && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          <MapPin className={cn(
            "h-6 w-6",
            deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="text-center">
            <p className={cn(
              "font-medium text-sm",
              deliveryMethod === "pickup" ? "text-primary" : "text-foreground"
            )}>
              Collection
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Collect from our kitchen
            </p>
          </div>
          <span className={cn(
            "text-xs font-medium mt-1",
            deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"
          )}>
            {collectionFee > 0 ? `+£${collectionFee.toFixed(2)}` : 'Free'}
          </span>
        </button>
      </div>

      {/* Delivery Postcode Input */}
      {deliveryMethod === "delivery" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="delivery-postcode" className="text-sm font-medium">
            Delivery postcode
          </Label>
          <Input
            id="delivery-postcode"
            placeholder="e.g. SW1A 1AA"
            value={manualPostcode}
            onChange={(e) => onPostcodeChange(e.target.value.toUpperCase())}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            We'll check delivery availability in your area.
          </p>
          
          {postcodeChecked && !deliveryZone && manualPostcode.length >= 5 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Sorry, we don't deliver to this postcode yet. Try collection or a different postcode.
              </p>
            </div>
          )}
          
          {deliveryZone && (
            <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">
                  {deliveryZone.zone_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Delivery available · {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)} delivery fee` : 'Free delivery'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collection Point Picker */}
      {deliveryMethod === "pickup" && collectionPoints.length > 0 && (
        <div className="pt-2">
          <CollectionPointPicker
            collectionPoints={collectionPoints}
            selectedCollectionPoint={selectedCollectionPoint}
            onCollectionPointChange={onCollectionPointChange}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(EnhancedDeliveryOptions);
