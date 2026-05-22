import * as React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../lib/cn'

const badgeVariants = tv({
  base: 'focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary border-primary/20 border',
      secondary: 'bg-surface text-text-muted border-border border',
      destructive: 'bg-error/10 text-error border-error/20 border',
      outline: 'border-border text-text',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
