import { RiftClientState } from '@/core/rift/rift-client'
import { useTranslation } from 'react-i18next'

type ConnectionStatusProps = {
  clientState: RiftClientState
  error: string | null
}

export function ConnectionStatus({ clientState, error }: ConnectionStatusProps) {
  const { t } = useTranslation()

  if (error) {
    return (
      <div className="mt-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center">
        <p className="font-medium">{error}</p>
      </div>
    )
  }

  if (clientState === RiftClientState.CONNECTING) {
    return (
      <div className="mt-8 text-center animate-pulse">
        <p className="text-primary font-medium tracking-widest uppercase">{t('connection.connectingToRift')}</p>
      </div>
    )
  }

  if (clientState === RiftClientState.HANDSHAKING) {
    return (
      <div className="mt-8 text-center animate-pulse">
        <p className="text-primary font-medium tracking-widest uppercase">{t('connection.securingConnection')}</p>
      </div>
    )
  }

  return null
}
