import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface AdminLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  }>;
  children: ReactNode;
  className?: string;
}

export function AdminLayout({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryActions = [],
  children,
  className = ""
}: AdminLayoutProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1">{title}</h1>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              ))}
              
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                >
                  {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-xl pointer-events-none z-0"></div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}