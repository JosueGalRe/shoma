import * as React from 'react'

import { tv } from 'tailwind-variants';
import type { VariantProps } from 'tailwind-variants';

import { cn } from '../lib/cn'

const alertVariants = tv({
  base: 'relative w-full rounded-lg p-4 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7',
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-surface/70 border-border-gold/30 text-text [&>svg]:text-text border',
      destructive: 'bg-error/10 border-error/30 text-error [&>svg]:text-error border',
    },
  },
})

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} role='alert' className={cn(alertVariants({ variant }), className)} {...props} />
  },
)

Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h5 ref={ref} className={cn('mb-1 leading-none font-medium tracking-tight', className)} {...props}>
        {children}
      </h5>
    )
  },
)

AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  },
)

AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription, AlertTitle, alertVariants }
