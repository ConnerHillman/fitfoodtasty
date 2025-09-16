import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SimpleDateRangePickerProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function SimpleDateRangePicker({
  date,
  onDateChange,
  placeholder = "Select date range",
  className,
}: SimpleDateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                placeholder
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              onDateChange?.(range)
              if (range?.from && range?.to) {
                setIsOpen(false)
              }
            }}
            numberOfMonths={1}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}