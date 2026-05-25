import { OTPInput } from 'input-otp'

import { cn } from '@/lib/shared-utils'

import { inputOTPStyles } from './input-otp-styles'

import type { InputOTPRootProps } from './input-otp-types'

export function InputOTP({ className, containerClassName, ...props }: InputOTPRootProps) {
  const styles = inputOTPStyles()

  return (
    <OTPInput
      data-slot='input-otp'
      containerClassName={cn(styles.root(), containerClassName)}
      className={cn(styles.input(), className)}
      {...props}
    />
  )
}
