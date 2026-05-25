import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

const Card = ({ className, ref, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      ref={ref}
      className={cn('bg-surface/60 border-border-gold/20 rounded-xl border shadow-lg backdrop-blur-lg', className)}
      {...props}
    />
  )
}

Card.displayName = 'Card'

const CardHeader = ({ className, ref, ...props }: ComponentProps<'div'>) => {
  return <div ref={ref} className={cn('border-border-gold/10 flex flex-col border-b p-6 pb-4', className)} {...props} />
}

CardHeader.displayName = 'CardHeader'

const CardTitle = ({ className, children, ref, ...props }: ComponentProps<'h3'>) => {
  return (
    <h3 ref={ref} className={cn('text-primary font-display text-lg leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

CardTitle.displayName = 'CardTitle'

const CardDescription = ({ className, ref, ...props }: ComponentProps<'p'>) => {
  return <p ref={ref} className={cn('text-text-muted font-body text-sm', className)} {...props} />
}

CardDescription.displayName = 'CardDescription'

const CardContent = ({ className, ref, ...props }: ComponentProps<'div'>) => {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
}

CardContent.displayName = 'CardContent'

const CardFooter = ({ className, ref, ...props }: ComponentProps<'div'>) => {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
