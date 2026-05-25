import { use } from 'react'

import { OTPInputContext } from 'input-otp'

import { cn } from '@/lib/shared-utils'

import { inputOTPStyles } from './input-otp-styles'

import type { InputOTPSlotProps } from './input-otp-types'

export function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const styles = inputOTPStyles()

  // eslint-disable-next-line react-doctor/no-react19-deprecated-apis -- shadcn/ui upstream component, useContext is required for compatibility
  const inputOTPContext = use(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div data-slot='input-otp-slot' data-active={isActive} className={cn(styles.slot(), className)} {...props}>
      {char}

      {hasFakeCaret && (
        <div className={styles.slotCaretWrap()}>
          <div className={styles.slotCaret()} />
        </div>
      )}
    </div>
  )
}
