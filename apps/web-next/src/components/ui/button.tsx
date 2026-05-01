import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-[#c8a96e] to-[#785a28] text-[#010a13] font-semibold shadow-lg shadow-black/50 hover:from-[#f0e6d2] hover:to-[#c8a96e] border border-[#c8a96e]/50 active:scale-95 active:shadow-inner',
        destructive:
          'bg-gradient-to-b from-[#d32f2f] to-[#8b1a1a] text-white font-semibold shadow-lg shadow-black/50 hover:from-[#e57373] hover:to-[#d32f2f] border border-[#d32f2f]/50 active:scale-95 active:shadow-inner',
        outline:
          'bg-transparent text-[#c8a96e] border border-[#785a28] hover:bg-[#c8a96e]/10 hover:border-[#c8a96e] shadow-sm active:scale-95 active:shadow-inner',
        secondary:
          'bg-[#1e2328] text-[#f0e6d2] border border-[#1e2328] hover:bg-[#2a2f35] hover:border-[#785a28] active:scale-95 active:shadow-inner',
        ghost: 'hover:bg-[#c8a96e]/10 hover:text-[#f0e6d2] text-[#a09b8c] active:scale-95',
        link: 'text-[#c8a96e] underline-offset-4 hover:underline hover:text-[#f0e6d2] active:scale-95',
        hextech:
          'bg-[#0ac8b9] text-[#010a13] font-semibold shadow-lg shadow-black/50 hover:bg-[#4dd0e1] border border-[#0ac8b9]/50 active:scale-95 active:shadow-inner',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
