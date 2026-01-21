import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-base font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-background p-0 hover:bg-accent hover:text-accent-foreground rounded-lg border-border shadow-sm transition-all",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex mb-1",
        head_cell: "text-muted-foreground rounded-md w-10 font-medium text-xs uppercase tracking-wide",
        row: "flex w-full mt-1",
        cell: cn(
          "relative h-10 w-10 text-center text-sm p-0.5",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected])]:rounded-lg",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
          "first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium rounded-lg transition-all duration-150",
          "aria-selected:opacity-100",
          // Available days get enhanced styling
          "text-foreground",
          "hover:bg-primary/20 hover:text-primary hover:scale-105 hover:font-semibold",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground font-semibold",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "shadow-md ring-2 ring-primary/30 ring-offset-1",
        ),
        day_today: cn(
          "bg-accent text-accent-foreground font-semibold",
          "ring-1 ring-primary/40",
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/30",
          "hover:bg-transparent hover:scale-100",
          "aria-selected:bg-accent/30 aria-selected:text-muted-foreground/50",
        ),
        day_disabled: cn(
          "text-muted-foreground/25 cursor-not-allowed",
          "hover:bg-transparent hover:text-muted-foreground/25 hover:scale-100 hover:font-medium",
          "line-through decoration-muted-foreground/30",
        ),
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
