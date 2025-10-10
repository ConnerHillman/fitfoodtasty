import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SimpleDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

export function SimpleDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  showClearButton = true,
}: SimpleDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleClearDate = () => {
    onDateChange(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            onDateChange(newDate);
            if (newDate) setOpen(false);
          }}
          initialFocus
          className="pointer-events-auto"
        />
        {showClearButton && date && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleClearDate}
            >
              Clear Date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
