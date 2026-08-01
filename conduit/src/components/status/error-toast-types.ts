import type { ConduitErrorCode } from '../../app-types'
import type { TranslationKey } from '../../hooks/use-i18n'

export interface ErrorToastProps {
  error: ConduitErrorCode
  t: (key: TranslationKey) => string
}
