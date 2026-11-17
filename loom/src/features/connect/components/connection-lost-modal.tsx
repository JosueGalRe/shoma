import { useState, useSyncExternalStore } from 'react'

import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { Modal } from '@shoma/ui/modal'
import { create } from '@stylexjs/stylex'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import type { RelayLostReason } from '@/core/state/relay-store'

function subscribeToOnline(onChange: () => void): () => void {
  return onlineManager.subscribe(onChange)
}

function readIsOnline(): boolean {
  return onlineManager.isOnline()
}

function getMessageKey(isOnline: boolean, reason: RelayLostReason | null): string {
  if (!isOnline) {
    return 'connection.lost.offline'
  }

  return reason === 'client-closed' ? 'connection.lost.clientClosed' : 'connection.lost.pc'
}

// Figma "Errors" (451:38940): over any connected screen while the relay is away. The session stays and its client
// Tries again on its own; CLOSE leaves the dashboard DISCONNECTED until Conduit is back
export function ConnectionLostModal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isLost = useRelayStore(relayStoreSelectors.status) === 'lost'
  const lostReason = useRelayStore(relayStoreSelectors.lostReason)
  const isOnline = useSyncExternalStore(subscribeToOnline, readIsOnline)
  const [isDismissed, setIsDismissed] = useState(false)

  // A new loss opens it again
  if (!isLost && isDismissed) {
    setIsDismissed(false)
  }

  const close = () => {
    setIsDismissed(true)
    // The screens' data is from before the loss: the dashboard waits without it, and the client's phase loads again
    // Once it's back, taking the screens where the client is
    queryClient.removeQueries({ queryKey: ['lcu'] })
    void navigate({ to: '/connected/lobby' })
  }

  return (
    <Modal
      description={t(getMessageKey(isOnline, lostReason))}
      icon={isOnline ? undefined : <Icon name="error" size={32} />}
      open={isLost && !isDismissed}
      style={styles.panel}
      title={t('connection.lost.title')}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <Button style={styles.fullWidth} variant="secondary" onClick={close}>
        {t('common.close')}
      </Button>
    </Modal>
  )
}

const styles = create({
  fullWidth: {
    width: '100%',
  },
  // The Errors page draws the panel opaque, unlike the swap and match found ones
  panel: {
    backgroundImage: 'linear-gradient(#2d515c, #051019 69%)',
  },
})
