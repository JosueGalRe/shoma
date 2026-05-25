import type { InputOTPSeparatorProps } from './input-otp-types'

export function InputOTPSeparator({ ...props }: InputOTPSeparatorProps) {
  return <hr data-slot="input-otp-separator" {...props} />
}
