import type { ConduitErrorCode } from '../app-types'
import type { TranslationKey } from '../app-utils'

export interface ErrorToastProps {
  error: ConduitErrorCode
  t: (key: TranslationKey) => string
}
