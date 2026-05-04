import { ConnectEntryForm } from './connect-entry-form'
import { ConnectionStatus } from './connection-status'
import { useConnectionFlow } from '../hooks/use-connection-flow'
import { RiftClientState } from '@/core/rift/rift-client'

export function ConnectScreen() {
  const {
    code,
    setCode,
    status,
    clientState,
    error,
    handleConnect,
    handleCancel,
  } = useConnectionFlow()

  const isConnecting = status === 'connecting' || clientState === RiftClientState.CONNECTING || clientState === RiftClientState.HANDSHAKING

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Mimic</h1>
          <p className="text-muted-foreground">Connect to your League client</p>
        </div>

        <ConnectEntryForm
          code={code}
          setCode={setCode}
          onSubmit={handleConnect}
          onCancel={handleCancel}
          isConnecting={isConnecting}
        />

        <ConnectionStatus clientState={clientState} error={error} />
      </div>
    </div>
  )
}
