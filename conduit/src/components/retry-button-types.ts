import type { TranslationKey } from '../app-utils'

export interface RetryButtonProps {
  reconnectAttempt: number
  disabled: boolean
  t: (key: TranslationKey) => string
}
