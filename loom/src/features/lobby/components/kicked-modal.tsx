import { useEffect, useState } from 'react'

import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { readKickedNotificationId } from '@/core/lcu/parsers/lobby'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

// The client's alert when the owner kicks the local player, from the lobby's notifications. As the client, it reads
// The newest and deletes it once handled; the desktop client deletes it too, so it's watched as events, not a query
export function KickedModal() {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const [open, setOpen] = useState(false)

  // External system sync: the lobby's notifications
  useEffect(() => {
    if (!transport) {
      return undefined
    }

    const unsubscribe = transport.observe(LcuPaths.lobby.notifications, (result) => {
      const notificationId = readKickedNotificationId(result.content)

      if (notificationId !== null) {
        setOpen(true)

        transport.request(LcuPaths.lobby.notification(notificationId), LcuHttpMethod.DELETE).catch(() => {
          // The desktop client may have deleted it first
        })
      }
    })

    return () => {
      unsubscribe
        .then((fn) => {
          return fn()
        })
        .catch(() => {
          // Cleanup errors are safe to ignore.
        })
    }
  }, [transport])

  return (
    <Modal open={open} title={t('lobby.kicked')} onOpenChange={setOpen}>
      <Button
        style={styles.fullWidth}
        onClick={() => {
          setOpen(false)
        }}
      >
        {t('common.ok')}
      </Button>
    </Modal>
  )
}

const styles = create({
  fullWidth: {
    width: '100%',
  },
})
