import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success text-primary-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        // Order status variants
        confirmed: "border-transparent bg-[hsl(var(--status-confirmed))] text-[hsl(var(--status-confirmed-foreground))]",
        completed: "border-transparent bg-[hsl(var(--status-completed))] text-[hsl(var(--status-completed-foreground))]",
        cancelled: "border-transparent bg-[hsl(var(--status-cancelled))] text-[hsl(var(--status-cancelled-foreground))]",
        pending: "border-transparent bg-[hsl(var(--status-pending))] text-[hsl(var(--status-pending-foreground))]",
        preparing: "border-transparent bg-[hsl(var(--status-preparing))] text-[hsl(var(--status-preparing-foreground))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
