import * as React from 'react'

import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../lib/cn'

const buttonVariants = tv({
  base: 'focus-visible:ring-ring inline-flex items-center justify-center rounded-[4px_12px_4px_12px] text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      default: 'min-h-[44px] px-4 py-2',
      icon: 'h-11 w-11',
      lg: 'h-11 rounded-md px-8',
      sm: 'min-h-[44px] rounded-md px-3',
    },
    variant: {
      default:
        'bg-surface/80 border-border-gold/30 text-primary hover:bg-surface-hover hover:border-primary/50 border backdrop-blur-md hover:shadow-[0_0_15px_color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]',
      destructive: 'border-error/30 text-error hover:bg-error/10 border',
      ghost: 'hover:bg-surface-elevated hover:text-text',
      link: 'text-primary underline-offset-4 hover:underline',
      primary:
        'bg-surface/80 border-border-gold/30 text-primary hover:bg-surface-hover hover:border-primary/50 border backdrop-blur-md hover:shadow-[0_0_15px_color-mix(in_srgb,var(--shoma-primary)_30%,transparent)]',
      secondary: 'border-border text-text-muted hover:bg-surface-elevated hover:text-text border bg-transparent',
    },
  },
})

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
})

Button.displayName = 'Button'

export { Button, buttonVariants }
