import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

import { alertVariants } from './alert-styles'

import type { AlertProps } from './alert-types'

const Alert = ({ className, variant, ref, ...props }: AlertProps) => {
  return <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

Alert.displayName = 'Alert'

const AlertTitle = ({ className, children, ref, ...props }: ComponentProps<'h5'>) => {
  return (
    <h5 ref={ref} className={cn('mb-1 leading-none font-medium tracking-tight', className)} {...props}>
      {children}
    </h5>
  )
}

AlertTitle.displayName = 'AlertTitle'

const AlertDescription = ({ className, ref, ...props }: ComponentProps<'div'>) => {
  return <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}

AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription, AlertTitle }
