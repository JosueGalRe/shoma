import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { LobbyKickModalProps } from './lobby-screen-types'

// The client's kick dialog: KICK or CANCEL
export function LobbyKickModal({ name, onKick, onOpenChange, open }: LobbyKickModalProps) {
  const { t } = useTranslation()

  return (
    <Modal open={open} title={t('lobby.memberMenu.kickConfirm', { name })} onOpenChange={onOpenChange}>
      <Button
        style={styles.fullWidth}
        onClick={() => {
          onOpenChange(false)
          onKick()
        }}
      >
        {t('lobby.memberMenu.kick')}
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
