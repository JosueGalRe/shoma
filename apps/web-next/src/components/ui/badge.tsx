import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lol-gold focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-lol-navy-800 text-lol-text-secondary hover:bg-lol-navy-700",
        secondary: "border-transparent bg-lol-navy-700 text-lol-text-primary hover:bg-lol-navy-600",
        destructive: "border-transparent bg-red-900/50 text-red-400 hover:bg-red-900/70",
        outline: "text-lol-gold border-lol-border-gold",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
