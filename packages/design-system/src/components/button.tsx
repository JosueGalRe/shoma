import { cn } from '../lib/cn'

import { buttonVariants } from './button-styles'

import type { ButtonProps } from './button-types'

function Button({ className, variant, size, type = 'button', ref, ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
}

Button.displayName = 'Button'

export { Button }
