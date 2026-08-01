import type { DeviceApprovalRequest } from '../app-types'
import type { TranslationKey } from '../app-utils'

export interface DeviceApprovalModalProps {
  request: DeviceApprovalRequest
  t: (key: TranslationKey, params?: Record<string, string>) => string
  onResolved: () => void
}
