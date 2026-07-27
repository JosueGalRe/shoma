import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import { cn } from '../lib/cn'

import type { ReactNode } from 'react'

export interface ScrollAreaProps {
  children: ReactNode
  className?: string
  fillContent?: boolean
  viewportClassName?: string
}

function ScrollArea({ children, className, fillContent, viewportClassName }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      type="always"
      className={cn('relative flex h-full min-h-0 flex-col overflow-hidden', className)}
      data-scroll-fill={fillContent ? '' : undefined}
    >
      <ScrollAreaPrimitive.Viewport className={cn('w-full min-h-0 flex-1 rounded-[inherit]', viewportClassName)}>
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
