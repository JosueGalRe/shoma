import { Button, Icon } from '@shoma/design-system'
import { invoke } from '@tauri-apps/api/core'

import { deviceApprovalModalStyles } from './device-approval-modal-styles'

import type { DeviceApprovalRequest } from '../app-types'
import type { TranslationKey } from '../app-utils'
import type { DeviceApprovalModalProps } from './device-approval-modal-types'

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

  const { overlay, modal, header, icon, title, body, actions, button } = deviceApprovalModalStyles()

  return (
    <div className={overlay()}>
      <div className={modal()}>
        <div className={header()}>
          <div className={icon()}>
            <Icon name="settings" size={20} />
          </div>

          <h2 className={title()}>{t('approval.title')}</h2>
        </div>

        <p className={body()}>{t('approval.body', { browser: request.browser, device: request.device })}</p>

        <div className={actions()}>
          <Button variant="destructive" onClick={handleReject} className={button({ type: 'reject' })}>
            <Icon name="x" size="sm" />

            {t('approval.reject')}
          </Button>

          <Button variant="primary" onClick={handleApprove} className={button({ type: 'approve' })}>
            <Icon name="check" size="sm" tone="primary" />

            {t('approval.approve')}
          </Button>
        </div>
      </div>
    </div>
  )
}
