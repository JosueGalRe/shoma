import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import { cn } from '../lib/cn'

import type { ReactNode } from 'react'

export interface ScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
}

function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root type="always" className={cn('relative h-full min-h-0 overflow-hidden', className)}>
      <ScrollAreaPrimitive.Viewport className={cn('h-full w-full rounded-[inherit]', viewportClassName)}>
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none p-0.5 select-none data-[state=hidden]:hidden"
      >
        <ScrollAreaPrimitive.Thumb className="bg-muted/60 hover:bg-muted relative flex-1 rounded-full transition-colors" />
      </ScrollAreaPrimitive.Scrollbar>

      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

ScrollArea.displayName = 'ScrollArea'

export { ScrollArea }
