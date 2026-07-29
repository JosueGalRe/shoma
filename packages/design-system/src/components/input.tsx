import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

export type InputProps = ComponentProps<'input'>

function Input({ className, type, ref, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'border-border bg-surface/40 text-text placeholder:text-text-muted focus:border-primary focus:ring-primary/30 flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

Input.displayName = 'Input'

export { Input }
