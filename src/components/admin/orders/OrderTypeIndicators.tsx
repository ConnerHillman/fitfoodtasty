import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wrench, Banknote, Pencil, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTypeIndicatorsProps {
  isManual?: boolean;
  isCash?: boolean;
  isAdjusted?: boolean;
  isVoided?: boolean;
  className?: string;
}

interface IndicatorConfig {
  icon: typeof Wrench;
  tooltip: string;
  color: string;
  show: boolean;
}

export function OrderTypeIndicators({
  isManual = false,
  isCash = false,
  isAdjusted = false,
  isVoided = false,
  className
}: OrderTypeIndicatorsProps) {
  const indicators: IndicatorConfig[] = [
    {
      icon: Wrench,
      tooltip: "Manual order (created by admin)",
      color: "text-blue-500",
      show: isManual
    },
    {
      icon: Banknote,
      tooltip: "Cash payment",
      color: "text-emerald-500",
      show: isCash
    },
    {
      icon: Pencil,
      tooltip: "Adjusted order",
      color: "text-amber-500",
      show: isAdjusted
    },
    {
      icon: XCircle,
      tooltip: "Voided order",
      color: "text-destructive",
      show: isVoided
    }
  ];

  const visibleIndicators = indicators.filter(i => i.show);

  if (visibleIndicators.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("inline-flex items-center gap-1", className)}>
        {visibleIndicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <span className={cn(
                  "inline-flex items-center justify-center",
                  indicator.color
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="text-xs font-medium px-2 py-1"
              >
                {indicator.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
