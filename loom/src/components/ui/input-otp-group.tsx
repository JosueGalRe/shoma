import { cn } from '@/lib/shared-utils'

import { inputOTPStyles } from './input-otp-styles'

import type { InputOTPGroupProps } from './input-otp-types'

export function InputOTPGroup({ className, ...props }: InputOTPGroupProps) {
  const styles = inputOTPStyles()

  return <div data-slot='input-otp-group' className={cn(styles.group(), className)} {...props} />
}
