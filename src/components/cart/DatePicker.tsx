import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  requestedDeliveryDate: string;
  onDateChange: (date: string) => void;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  deliveryMethod: "delivery" | "pickup";
  isDateAvailable: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  getMinDeliveryDate: () => string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  requestedDeliveryDate,
  onDateChange,
  calendarOpen,
  onCalendarOpenChange,
  deliveryMethod,
  isDateAvailable,
  isDateDisabled,
  getMinDeliveryDate,
}) => {
  const selectedDate = requestedDeliveryDate ? new Date(requestedDeliveryDate + 'T12:00:00') : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(format(date, 'yyyy-MM-dd'));
      onCalendarOpenChange(false);
    }
  };

  return (
    <Card className="bg-background border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {deliveryMethod === "pickup" ? "Collection" : "Delivery"} Date
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-12",
                  !requestedDeliveryDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {requestedDeliveryDate ? (
                  format(new Date(requestedDeliveryDate + 'T12:00:00'), "PPPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  if (isDateDisabled(date)) return true;
                  return !isDateAvailable(date);
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                fromDate={new Date(getMinDeliveryDate() + 'T12:00:00')}
                toDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)} // 2 weeks from now
              />
            </PopoverContent>
          </Popover>

          {requestedDeliveryDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-blue-700">
                Your {deliveryMethod === "pickup" ? "collection" : "delivery"} is scheduled for{" "}
                <span className="font-medium">
                  {format(new Date(requestedDeliveryDate + 'T12:00:00'), "EEEE, MMMM do, yyyy")}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(DatePicker);