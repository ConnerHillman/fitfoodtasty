import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CheckoutStepCardProps {
  stepNumber?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  isOptional?: boolean;
}

const CheckoutStepCard: React.FC<CheckoutStepCardProps> = ({
  stepNumber,
  title,
  subtitle,
  children,
  className,
  isOptional = false,
}) => {
  return (
    <Card className={cn(
      "bg-card border border-border/60 shadow-sm",
      isOptional && "border-border/40 bg-muted/20",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          {stepNumber && (
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {stepNumber}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold",
              stepNumber ? "text-lg" : "text-base",
              isOptional && "text-muted-foreground"
            )}>
              {title}
              {isOptional && (
                <span className="text-xs font-normal text-muted-foreground ml-2">(optional)</span>
              )}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default React.memo(CheckoutStepCard);
