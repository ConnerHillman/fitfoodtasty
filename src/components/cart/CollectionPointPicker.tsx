import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CollectionPoint {
  id: string;
  point_name: string;
  address: string;
  collection_fee: number;
}

interface CollectionPointPickerProps {
  selectedCollectionPoint: string;
  onCollectionPointChange: (pointId: string) => void;
  collectionPoints: CollectionPoint[];
}

const CollectionPointPicker: React.FC<CollectionPointPickerProps> = ({
  selectedCollectionPoint,
  onCollectionPointChange,
  collectionPoints,
}) => {
  const [open, setOpen] = useState(false);
  
  const selectedPoint = collectionPoints.find(p => p.id === selectedCollectionPoint);
  
  const handleSelect = (pointId: string) => {
    onCollectionPointChange(pointId);
    setOpen(false);
  };

  return (
    <div>
      <Label htmlFor="collection-point">Collection Point</Label>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            id="collection-point"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mt-1 h-12 text-left font-normal"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              {selectedPoint ? (
                <span className="truncate">{selectedPoint.point_name}</span>
              ) : (
                <span className="text-muted-foreground">Select a collection point</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Collection Point</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-2 py-2">
            {collectionPoints.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No collection points available
              </p>
            ) : (
              collectionPoints.map((point) => (
                <button
                  key={point.id}
                  onClick={() => handleSelect(point.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-colors",
                    "hover:bg-accent hover:border-primary/30",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    selectedCollectionPoint === point.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{point.point_name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {point.address}
                      </div>
                      {point.collection_fee > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Collection fee: £{point.collection_fee.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {selectedCollectionPoint === point.id && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default React.memo(CollectionPointPicker);
