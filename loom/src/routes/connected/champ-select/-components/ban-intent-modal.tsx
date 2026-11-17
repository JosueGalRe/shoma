import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { BanIntentModalProps } from './champ-select-screen-types'

// The client's ban-intent dialog: banning a champion someone on the team declared asks first, the player's own or an
// Ally's, by name
export function BanIntentModal({ allyName, onBan, onOpenChange, open }: BanIntentModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      description={
        allyName === null
          ? t('champSelect.banIntent.descriptionSelf')
          : t('champSelect.banIntent.description', { name: allyName })
      }
      open={open}
      title={t(allyName === null ? 'champSelect.banIntent.titleSelf' : 'champSelect.banIntent.title')}
      onOpenChange={onOpenChange}
    >
      <Button
        style={styles.fullWidth}
        onClick={() => {
          onOpenChange(false)
          onBan()
        }}
      >
        {t('champSelect.banIntent.ban')}
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
