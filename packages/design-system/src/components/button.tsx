import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px_12px_4px_12px] text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-surface/80 backdrop-blur-md border border-border-gold/30 text-primary hover:bg-surface-hover hover:border-primary/50 hover:shadow-[0_0_15px_color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]",
        primary:
          "bg-surface/80 backdrop-blur-md border border-border-gold/30 text-primary hover:bg-surface-hover hover:border-primary/50 hover:shadow-[0_0_15px_color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]",
        secondary:
          "bg-transparent border border-border text-text-muted hover:bg-surface-elevated hover:text-text",
        destructive: "border border-error/30 text-error hover:bg-error/10",
        ghost: "hover:bg-surface-elevated hover:text-text",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-[44px] rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
