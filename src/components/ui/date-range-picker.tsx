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

interface DateRangePickerProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [clickCount, setClickCount] = React.useState(0)
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)

  // Reset temp date when the prop changes
  React.useEffect(() => {
    setTempDate(date)
    setClickCount(0)
  }, [date])

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    if (!selectedDate?.from) {
      setTempDate(undefined)
      setClickCount(0)
      return
    }

    if (clickCount === 0) {
      // First click - set the start date
      setTempDate({ from: selectedDate.from, to: selectedDate.from })
      setClickCount(1)
    } else {
      // Second click - finalize the selection
      let finalDate: DateRange | undefined

      if (selectedDate.from.getTime() === tempDate?.from?.getTime()) {
        // Same date clicked twice - single date selection
        finalDate = { from: selectedDate.from, to: selectedDate.from }
      } else {
        // Different date - range selection
        const startDate = tempDate?.from
        const endDate = selectedDate.from
        
        if (startDate && endDate) {
          if (startDate <= endDate) {
            finalDate = { from: startDate, to: endDate }
          } else {
            finalDate = { from: endDate, to: startDate }
          }
        }
      }

      setTempDate(finalDate)
      onDateChange?.(finalDate)
      setIsOpen(false)
      setClickCount(0)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset if closing without completing selection
      setTempDate(date)
      setClickCount(0)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to && date.from.getTime() !== date.to.getTime() ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={tempDate}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
          <div className="p-3 border-t text-xs text-muted-foreground">
            {clickCount === 0 ? "Click a date to start selection" : "Click another date to complete range (or same date for single day)"}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}