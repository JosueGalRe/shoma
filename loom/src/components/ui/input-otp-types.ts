import { OTPInput } from 'input-otp'
import type { ComponentProps } from 'react'

export type InputOTPRootProps = ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}

export type InputOTPGroupProps = ComponentProps<'div'>

export type InputOTPSlotProps = ComponentProps<'div'> & {
  index: number
}

export type InputOTPSeparatorProps = ComponentProps<'div'>
