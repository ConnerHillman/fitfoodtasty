import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Check, AlertCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedDatePickerProps {
  requestedDeliveryDate: string;
  onDateChange: (date: string) => void;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  deliveryMethod: "delivery" | "pickup";
  isDateAvailable: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  availableDays: string[];
  // New props for contextual messaging
  isDeliveryZoneSet?: boolean;
  isCollectionPointSet?: boolean;
}

const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  requestedDeliveryDate,
  onDateChange,
  calendarOpen,
  onCalendarOpenChange,
  deliveryMethod,
  isDateAvailable,
  isDateDisabled,
  availableDays,
  isDeliveryZoneSet = true,
  isCollectionPointSet = true,
}) => {
  const selectedDate = requestedDeliveryDate ? new Date(requestedDeliveryDate + 'T12:00:00') : undefined;
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Double-check the date is valid before setting (safety net)
    if (isDateDisabled(date) || !isDateAvailable(date)) {
      return;
    }
    
    const formattedDate = date.toISOString().split('T')[0];
    onDateChange(formattedDate);
    onCalendarOpenChange(false);
  };

  const dateLabel = deliveryMethod === "pickup" ? "collection" : "delivery";
  
  // Format available days for display legend
  const formattedAvailableDays = availableDays
    .map(d => d.charAt(0).toUpperCase() + d.slice(1))
    .join(", ");

  // Determine if there's a blocking reason preventing date selection
  const blockingMessage = useMemo(() => {
    if (deliveryMethod === "delivery" && !isDeliveryZoneSet) {
      return {
        icon: MapPin,
        title: "Enter your postcode first",
        description: "We need your postcode to show available delivery dates for your area."
      };
    }
    
    if (deliveryMethod === "pickup" && !isCollectionPointSet) {
      return {
        icon: MapPin,
        title: "Select a collection point first",
        description: "Choose where you'd like to collect your order to see available dates."
      };
    }
    
    if (availableDays.length === 0 && (isDeliveryZoneSet || isCollectionPointSet)) {
      return {
        icon: AlertCircle,
        title: "No dates available",
        description: "Please check your delivery area or contact support."
      };
    }
    
    return null;
  }, [deliveryMethod, isDeliveryZoneSet, isCollectionPointSet, availableDays.length]);

  const isBlocked = !!blockingMessage;
  const BlockingIcon = blockingMessage?.icon || AlertCircle;

  return (
    <div className="space-y-3">
      <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isBlocked}
            className={cn(
              "w-full h-12 justify-start text-left font-normal rounded-xl border-2 transition-all",
              isBlocked && "opacity-60 cursor-not-allowed",
              selectedDate 
                ? "border-primary bg-primary/5" 
                : "border-border/60 hover:border-border"
            )}
          >
            <CalendarDays className={cn(
              "mr-3 h-5 w-5",
              selectedDate ? "text-primary" : "text-muted-foreground"
            )} />
            {selectedDate ? (
              <span className="font-medium">
                {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {isBlocked ? `Select a ${dateLabel} date` : `Select a ${dateLabel} date`}
              </span>
            )}
            {selectedDate && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => isDateDisabled(date) || !isDateAvailable(date)}
            fromDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
            toDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
            initialFocus
            className="rounded-md border pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Available days legend */}
      {availableDays.length > 0 && !isBlocked && (
        <p className="text-xs text-muted-foreground px-1">
          {deliveryMethod === "pickup" ? "Collection" : "Delivery"} available: {formattedAvailableDays}
        </p>
      )}

      {/* Contextual messaging based on state */}
      {!selectedDate && (
        <>
          {blockingMessage ? (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
              <BlockingIcon className="h-4 w-4 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {blockingMessage.title}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  {blockingMessage.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Almost there — choose a {dateLabel} date to continue.
              </p>
            </div>
          )}
        </>
      )}

      {selectedDate && (
        <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {deliveryMethod === "pickup" ? "Collection" : "Delivery"} confirmed
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(EnhancedDatePicker);
