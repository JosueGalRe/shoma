import { MinusIcon } from 'lucide-react'

import type { InputOTPSeparatorProps } from './input-otp-types'

export function InputOTPSeparator({ ...props }: InputOTPSeparatorProps) {
  return (
    <div data-slot='input-otp-separator' role='separator' {...props}>
      <MinusIcon />
    </div>
  )
}
