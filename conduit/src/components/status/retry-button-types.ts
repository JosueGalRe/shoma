import type { TranslationKey } from '../../hooks/use-i18n-types'

export interface RetryButtonProps {
  reconnectAttempt: number
  disabled: boolean
  t: (key: TranslationKey) => string
}
