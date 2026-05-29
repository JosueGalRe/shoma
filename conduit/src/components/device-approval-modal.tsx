import { Button, Icon } from '@shoma/design-system'
import { invoke } from '@tauri-apps/api/core'

import type { DeviceApprovalRequest } from '../app-types'
import type { TranslationKey } from '../app-utils'

interface DeviceApprovalModalProps {
  request: DeviceApprovalRequest
  t: (key: TranslationKey, params?: Record<string, string>) => string
  onResolved: () => void
}

export function DeviceApprovalModal({ request, t, onResolved }: DeviceApprovalModalProps) {
  const handleApprove = async () => {
    await invoke('resolve_device_approval', {
      approvalId: request.approvalId,
      approved: true,
    })
    onResolved()
  }

  const handleReject = async () => {
    await invoke('resolve_device_approval', {
      approvalId: request.approvalId,
      approved: false,
    })
    onResolved()
  }

  return (
    <div className="approval-overlay">
      <div className="approval-modal">
        <div className="approval-header">
          <div className="approval-icon">
            <Icon name="settings" size={20} />
          </div>
          <h2 className="approval-title">{t('approval.title')}</h2>
        </div>

        <p className="approval-body">
          {t('approval.body', { device: request.device, browser: request.browser })}
        </p>

        <div className="approval-actions">
          <Button
            variant="destructive"
            onClick={handleReject}
            className="approval-button approval-button--reject"
          >
            <Icon name="x" size="sm" />
            {t('approval.reject')}
          </Button>

          <Button
            variant="primary"
            onClick={handleApprove}
            className="approval-button approval-button--approve"
          >
            <Icon name="check" size="sm" tone="primary" />
            {t('approval.approve')}
          </Button>
        </div>
      </div>
    </div>
  )
}
