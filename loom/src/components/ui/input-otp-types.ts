import type { ComponentProps } from 'react'

import type { OTPInput } from 'input-otp'

export type InputOTPRootProps = ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}

export type InputOTPGroupProps = ComponentProps<'div'>

export type InputOTPSlotProps = ComponentProps<'div'> & {
  index: number
}

export type InputOTPSeparatorProps = ComponentProps<'hr'>
