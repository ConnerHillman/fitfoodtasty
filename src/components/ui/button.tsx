import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Solid, confident, premium depth
        default: "bg-primary text-primary-foreground shadow-button hover:bg-primary/90 hover:shadow-button-hover hover:scale-[1.01] active:scale-[0.99]",
        // Destructive: Solid with warning presence
        destructive: "bg-destructive text-destructive-foreground shadow-button hover:bg-destructive/90 hover:shadow-button-hover active:scale-[0.99]",
        // Outline: Subtle 1px border, calm secondary action
        outline: "border border-border/60 bg-transparent text-foreground hover:bg-accent/50 hover:border-border active:scale-[0.99]",
        // Secondary: Soft filled background for secondary emphasis
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[0.99]",
        // Ghost: Minimal, text-only with subtle hover
        ghost: "text-muted-foreground hover:text-foreground hover:bg-accent/40 active:scale-[0.99]",
        // Link: Underline style for inline links
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 sm:h-10 px-5 py-2",
        sm: "h-10 sm:h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 sm:h-11 rounded-xl px-8",
        icon: "h-10 w-10 sm:h-9 sm:w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
