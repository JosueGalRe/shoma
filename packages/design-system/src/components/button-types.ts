import type { ComponentProps } from 'react'

import type { ButtonVariantProps } from './button-styles'

export interface ButtonProps extends ComponentProps<'button'>, ButtonVariantProps {
  asChild?: boolean
}
