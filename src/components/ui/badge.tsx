import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Order status variants
        confirmed: "border-transparent bg-[hsl(var(--status-confirmed))] text-[hsl(var(--status-confirmed-foreground))] hover:bg-[hsl(var(--status-confirmed))]/80",
        completed: "border-transparent bg-[hsl(var(--status-completed))] text-[hsl(var(--status-completed-foreground))] hover:bg-[hsl(var(--status-completed))]/80",
        cancelled: "border-transparent bg-[hsl(var(--status-cancelled))] text-[hsl(var(--status-cancelled-foreground))] hover:bg-[hsl(var(--status-cancelled))]/80",
        pending: "border-transparent bg-[hsl(var(--status-pending))] text-[hsl(var(--status-pending-foreground))] hover:bg-[hsl(var(--status-pending))]/80",
        preparing: "border-transparent bg-[hsl(var(--status-preparing))] text-[hsl(var(--status-preparing-foreground))] hover:bg-[hsl(var(--status-preparing))]/80",
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
