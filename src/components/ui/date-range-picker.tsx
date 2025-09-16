import * as React from "react"
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
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

const presetRanges = [
  {
    label: "Today",
    value: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) })
  },
  {
    label: "Yesterday", 
    value: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) })
  },
  {
    label: "Last 7 days",
    value: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) })
  },
  {
    label: "Last 30 days",
    value: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) })
  },
  {
    label: "Last 90 days",
    value: () => ({ from: startOfDay(subDays(new Date(), 89)), to: endOfDay(new Date()) })
  },
  {
    label: "This month",
    value: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) })
  },
  {
    label: "Last month",
    value: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })
  },
  {
    label: "This year",
    value: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) })
  }
]

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [clickCount, setClickCount] = React.useState(0)
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null)

  // Reset temp date when the prop changes
  React.useEffect(() => {
    setTempDate(date)
    setClickCount(0)
  }, [date])

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setTempDate(undefined)
      setClickCount(0)
      setSelectedPreset(null)
      return
    }

    setSelectedPreset(null)

    if (clickCount === 0) {
      // First click - set start date only
      setTempDate({ from: range.from, to: undefined })
      setClickCount(1)
      return
    }

    // Second click logic
    const first = tempDate?.from
    const second = range.from

    if (!first) {
      // Safety: if first missing, start over
      setTempDate({ from: second, to: undefined })
      setClickCount(1)
      return
    }

    if (range.to) {
      // DayPicker provided a full range
      if (second.getTime() < first.getTime()) {
        // Earlier than first: reset to fresh, require new first click
        setTempDate(undefined)
        setClickCount(0)
        return
      }
      const finalRange: DateRange = { from: first, to: range.to }
      setTempDate(finalRange)
      onDateChange?.(finalRange)
      setIsOpen(false)
      setClickCount(0)
      return
    }

    // No 'to' yet
    if (second.getTime() === first.getTime()) {
      // Same day twice -> single-day
      const finalDate: DateRange = { from: first, to: first }
      setTempDate(finalDate)
      onDateChange?.(finalDate)
      setIsOpen(false)
      setClickCount(0)
      return
    }

    // Switching the start day while selecting
    setTempDate({ from: second, to: undefined })
    setClickCount(1)
  }

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    const range = preset.value()
    setSelectedPreset(preset.label)
    setTempDate(range)
    onDateChange?.(range)
    setIsOpen(false)
    setClickCount(0)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Opening - reset to fresh state so first click starts new selection
      setTempDate(undefined)
      setClickCount(0)
    } else if (!open) {
      // Closing - reset if closing without completing selection
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
              "w-[280px] sm:w-[320px] justify-start text-left font-normal bg-background border-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
            {date?.from ? (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">
                  {date.to && date.from.getTime() !== date.to.getTime() ? (
                    <>
                      {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(date.from, "MMM dd, yyyy")
                  )}
                </span>
                {selectedPreset && (
                  <span className="text-xs text-muted-foreground truncate">{selectedPreset}</span>
                )}
                {!selectedPreset && date.to && date.from.getTime() !== date.to.getTime() && (
                  <span className="text-xs text-muted-foreground">Custom range</span>
                )}
              </div>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-2xl border-2" align="start">
          <div className="flex flex-col lg:flex-row">
            {/* Preset sidebar */}
            <div className="w-full lg:w-48 border-b lg:border-b-0 lg:border-r bg-muted/30 p-4 space-y-1">
              <h4 className="font-semibold text-sm text-foreground mb-3">Quick Select</h4>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 transition-all duration-150",
                      selectedPreset === preset.label && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="pt-3 border-t mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-normal h-9 text-muted-foreground"
                  onClick={() => {
                    setSelectedPreset(null)
                    setTempDate(undefined)
                    onDateChange?.(undefined)
                    setIsOpen(false)
                    setClickCount(0)
                  }}
                >
                  Clear dates
                </Button>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={tempDate}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                className="pointer-events-auto"
                classNames={{
                  months: "flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                  ),
                  day_range_end: "day-range-end",
                  day_range_start: "day-range-start",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
                {clickCount === 0 ? "Click a date to start selection" : "Click a later date to complete range, or an earlier date to restart"}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}