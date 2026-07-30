import type { ReactNode } from 'react'

import { Corner, Root, Scrollbar, Thumb, Viewport } from '@radix-ui/react-scroll-area'

import { cn } from '../lib/cn'

export interface ScrollAreaProps {
  children: ReactNode
  className?: string
  fillContent?: boolean
  viewportClassName?: string
}

function ScrollArea({ children, className, fillContent, viewportClassName }: ScrollAreaProps) {
  return (
    <Root
      type="always"
      className={cn('relative flex h-full min-h-0 flex-col overflow-hidden', className)}
      data-scroll-fill={fillContent ? '' : undefined}
    >
      <Viewport className={cn('min-h-0 w-full flex-1 rounded-[inherit]', viewportClassName)}>{children}</Viewport>

      <Scrollbar orientation="vertical" className="flex w-2 touch-none p-0.5 select-none data-[state=hidden]:hidden">
        <Thumb className="bg-muted/60 hover:bg-muted relative flex-1 rounded-full transition-colors" />
      </Scrollbar>

      <Corner />
    </Root>
  )
}

ScrollArea.displayName = 'ScrollArea'

export { ScrollArea }
