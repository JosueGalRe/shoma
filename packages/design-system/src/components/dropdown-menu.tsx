import type { ComponentProps } from 'react'

import {
  Content,
  Item,
  Label,
  Portal,
  Root,
  Separator,
  Trigger,
} from '@radix-ui/react-dropdown-menu'

import { cn } from '../lib/cn'

const DropdownMenu = Root
const DropdownMenuTrigger = Trigger
const DropdownMenuPortal = Portal

const DropdownMenuContent = ({ className, sideOffset = 4, ref, ...props }: ComponentProps<typeof Content>) => {
  return (
    <Portal>
      <Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'border-border bg-secondary text-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </Portal>
  )
}

DropdownMenuContent.displayName = Content.displayName

const DropdownMenuItem = ({ className, ref, ...props }: ComponentProps<typeof Item>) => {
  return (
    <Item
      ref={ref}
      className={cn(
        'focus:bg-accent focus:text-foreground relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

DropdownMenuItem.displayName = Item.displayName

const DropdownMenuLabel = ({ className, ref, ...props }: ComponentProps<typeof Label>) => {
  return <Label ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
}

DropdownMenuLabel.displayName = Label.displayName

const DropdownMenuSeparator = ({ className, ref, ...props }: ComponentProps<typeof Separator>) => {
  return <Separator ref={ref} className={cn('bg-border -mx-1 my-1 h-px', className)} {...props} />
}

DropdownMenuSeparator.displayName = Separator.displayName

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
