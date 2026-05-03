import type { FieldError, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form'

import { RiftClientState, type RiftClientState as RiftClientStateValue } from '../../../core/rift/rift-client-types'
import type { ConnectionCopy, ConnectionFormValues } from '../connect-types'
import { ConnectEntryForm } from './connect-entry-form'
import { ConnectScreenShell } from './connect-screen-shell'
import { ConnectionActions } from './connection-actions'
import { StatusCard } from './status-card'

type ConnectScreenProps = {
  status: RiftClientStateValue | null
  errorBanner: string | null
  shouldShowEntry: boolean
  isFailureState: boolean
  isPendingState: boolean
  statusCopy: ConnectionCopy | null
  code: string
  codeError?: FieldError
  register: UseFormRegister<ConnectionFormValues>
  handleSubmit: UseFormHandleSubmit<ConnectionFormValues>
  onSubmit: (values: ConnectionFormValues) => Promise<void>
  onCancel: () => void
  onRetry: () => void
}

export function ConnectScreen({
  status,
  errorBanner,
  shouldShowEntry,
  isFailureState,
  isPendingState,
  statusCopy,
  code,
  codeError,
  register,
  handleSubmit,
  onSubmit,
  onCancel,
  onRetry,
}: ConnectScreenProps) {
  const showForm = status !== RiftClientState.CONNECTED && !isFailureState

  return (
    <ConnectScreenShell errorBanner={errorBanner} status={status}>
      {showForm ? (
        <ConnectEntryForm
          code={code}
          codeError={codeError}
          handleSubmit={handleSubmit}
          onCancel={onCancel}
          onSubmit={onSubmit}
          register={register}
          isPendingState={isPendingState}
          isErrorState={!!errorBanner || !!codeError}
        />
      ) : null}

      {isFailureState ? <ConnectionActions mode='failure' onCancel={onCancel} onRetry={onRetry} /> : null}

      {isPendingState ? (
        <div className="mt-6 text-center">
          <p className="font-display text-lg tracking-widest text-primary uppercase animate-pulse">
            {status === RiftClientState.HANDSHAKING ? 'Handshaking...' : 'Connecting...'}
          </p>
        </div>
      ) : null}

      {isPendingState ? <ConnectionActions mode='pending' onCancel={onCancel} onRetry={onRetry} /> : null}

      {statusCopy && status !== RiftClientState.CONNECTED ? (
        <StatusCard copy={statusCopy} isError={isFailureState} />
      ) : null}
    </ConnectScreenShell>
  )
}
