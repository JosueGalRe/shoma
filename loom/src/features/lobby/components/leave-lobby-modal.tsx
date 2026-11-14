import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { LeaveLobbyModalProps } from './leave-lobby-modal-types'

// Leaving a party can't be undone without a new invite, so it asks first
export function LeaveLobbyModal({ onLeave, onOpenChange, open }: LeaveLobbyModalProps) {
  const { t } = useTranslation()

  return (
    <Modal open={open} title={t('lobby.leaveConfirm')} onOpenChange={onOpenChange}>
      <Button
        style={styles.fullWidth}
        onClick={() => {
          onOpenChange(false)
          onLeave()
        }}
      >
        {t('common.leave')}
      </Button>

      <Button
        style={styles.fullWidth}
        variant="secondary"
        onClick={() => {
          onOpenChange(false)
        }}
      >
        {t('common.cancel')}
      </Button>
    </Modal>
  )
}

const styles = create({
  fullWidth: {
    width: '100%',
  },
})
