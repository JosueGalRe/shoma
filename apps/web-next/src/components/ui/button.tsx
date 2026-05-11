import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px_12px_4px_12px] text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-lol-navy-800 border border-lol-border-gold text-lol-gold hover:bg-lol-navy-700 hover:shadow-lol-glow-gold",
        primary:
          "bg-lol-navy-800 border border-lol-border-gold text-lol-gold hover:bg-lol-navy-700 hover:shadow-lol-glow-gold",
        secondary: "bg-transparent border border-lol-border-subtle text-lol-text-secondary hover:bg-lol-navy-800 hover:text-lol-text-primary",
        destructive: "bg-lol-navy-800 border border-red-700 text-red-400 hover:bg-lol-navy-700",
        ghost: "hover:bg-lol-navy-800 hover:text-lol-text-primary",
        link: "text-lol-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
