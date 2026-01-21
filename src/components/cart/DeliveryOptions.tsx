import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

interface DeliveryOptionsProps {
  deliveryMethod: "delivery" | "pickup";
  onDeliveryMethodChange: (method: "delivery" | "pickup") => void;
  selectedCollectionPoint: string;
  onCollectionPointChange: (pointId: string) => void;
  collectionPoints: any[];
  manualPostcode: string;
  onPostcodeChange: (postcode: string) => void;
  deliveryZone: any;
  postcodeChecked: boolean;
  deliveryFee: number;
  getCollectionFee: () => number;
}

const DeliveryOptions: React.FC<DeliveryOptionsProps> = ({
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
  return (
    <Card className="bg-background border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Delivery Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Method Selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onDeliveryMethodChange("delivery")}
            className={`p-3 border-2 rounded-lg text-left transition-colors ${
              deliveryMethod === "delivery"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="font-medium">Delivery</div>
            <div className="text-sm text-muted-foreground">
              {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Free"}
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => onDeliveryMethodChange("pickup")}
            className={`p-3 border-2 rounded-lg text-left transition-colors ${
              deliveryMethod === "pickup"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="font-medium">Collection</div>
            <div className="text-sm text-muted-foreground">
              {getCollectionFee() > 0 ? `£${getCollectionFee().toFixed(2)}` : "Free"}
            </div>
          </button>
        </div>

        {/* Delivery-specific options */}
        {deliveryMethod === "delivery" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="postcode">Your Postcode</Label>
              <Input
                id="postcode"
                value={manualPostcode}
                onChange={(e) => onPostcodeChange(e.target.value)}
                placeholder="Enter your postcode"
                className="mt-1"
              />
            </div>
            
            {postcodeChecked && !deliveryZone && (
              <div className="mt-2">
                <Badge variant="destructive">
                  Delivery not available for this postcode
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Collection-specific options */}
        {deliveryMethod === "pickup" && (
          <div>
            <Label htmlFor="collection-point">Collection Point</Label>
            <Select value={selectedCollectionPoint} onValueChange={onCollectionPointChange}>
              <SelectTrigger id="collection-point" className="mt-1">
                <SelectValue placeholder="Select a collection point" />
              </SelectTrigger>
              <SelectContent>
                {collectionPoints.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    {point.point_name} - {point.address}
                    {point.collection_fee > 0 && ` (£${point.collection_fee.toFixed(2)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(DeliveryOptions);