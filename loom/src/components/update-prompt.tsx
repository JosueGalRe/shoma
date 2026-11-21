import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

interface UpdatePromptProps {
  onDismiss: () => void
  onUpdate: () => void
  open: boolean
}

// A new version of the PWA is waiting: reload into it now or keep the current one until the next launch
export function UpdatePrompt({ onDismiss, onUpdate, open }: UpdatePromptProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      description={t('update.body')}
      title={t('update.title')}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onDismiss()
        }
      }}
    >
      <Button style={styles.fullWidth} onClick={onUpdate}>
        {t('update.updateNow')}
      </Button>

      <Button style={styles.fullWidth} variant="secondary" onClick={onDismiss}>
        {t('update.later')}
      </Button>
    </Modal>
  )
}

const styles = create({
  fullWidth: {
    width: '100%',
  },
})
