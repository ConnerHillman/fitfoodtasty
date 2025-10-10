import React, { ReactNode, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  datePickerSlot?: ReactNode;
  requiresDate?: boolean;
  className?: string;
}

export function ReportButton({
  title,
  description,
  icon: Icon,
  onClick,
  datePickerSlot,
  requiresDate = false,
  className
}: ReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      setIsLoading(true);
      try {
        await onClick();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className={cn(
      "group transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1",
      "bg-gradient-to-br from-card to-card/50 border-border/50",
      "cursor-pointer",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {datePickerSlot && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Select {requiresDate ? 'Date' : 'Date Range'}
            </label>
            {datePickerSlot}
          </div>
        )}
        
        <Button 
          onClick={handleClick}
          className="w-full group-hover:shadow-md transition-shadow"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Generating...
            </>
          ) : (
            <>Generate Report</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
