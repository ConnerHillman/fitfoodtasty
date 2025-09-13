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
              "w-[320px] justify-start text-left font-normal bg-background border-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary/50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
            {date?.from ? (
              <div className="flex flex-col">
                <span className="font-medium">
                  {date.to && date.from.getTime() !== date.to.getTime() ? (
                    <>
                      {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(date.from, "MMM dd, yyyy")
                  )}
                </span>
                {selectedPreset && (
                  <span className="text-xs text-muted-foreground">{selectedPreset}</span>
                )}
                {!selectedPreset && date.to && date.from.getTime() !== date.to.getTime() && (
                  <span className="text-xs text-muted-foreground">Custom range</span>
                )}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-2xl border-2" align="start">
          <div className="flex">
            {/* Preset sidebar */}
            <div className="w-48 border-r bg-muted/30 p-4 space-y-1">
              <h4 className="font-semibold text-sm text-foreground mb-3">Quick Select</h4>
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