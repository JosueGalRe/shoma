import { RiftClientState } from '@/core/rift/rift-client'

type ConnectionStatusProps = {
  clientState: RiftClientState
  error: string | null
}

export function ConnectionStatus({ clientState, error }: ConnectionStatusProps) {
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
        <p className="text-primary font-medium tracking-widest uppercase">Connecting to Rift...</p>
      </div>
    )
  }

  if (clientState === RiftClientState.HANDSHAKING) {
    return (
      <div className="mt-8 text-center animate-pulse">
        <p className="text-primary font-medium tracking-widest uppercase">Securing connection...</p>
      </div>
    )
  }

  return null
}
