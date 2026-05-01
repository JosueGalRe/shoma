import type { FieldError, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form'

import { Spinner } from '@/components/ui/spinner'
import type { RiftClientState as RiftClientStateValue } from '../../../core/rift/rift-client-types'
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
  return (
    <ConnectScreenShell errorBanner={errorBanner} status={status}>
      {shouldShowEntry ? (
        <ConnectEntryForm
          code={code}
          codeError={codeError}
          handleSubmit={handleSubmit}
          onCancel={onCancel}
          onSubmit={onSubmit}
          register={register}
        />
      ) : null}

      {isFailureState ? <ConnectionActions mode='failure' onCancel={onCancel} onRetry={onRetry} /> : null}

      {isPendingState ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Spinner className="h-12 w-12" />
          <p className="font-display text-lg tracking-widest text-[#c8a96e] uppercase">Connecting...</p>
        </div>
      ) : null}

      {isPendingState ? <ConnectionActions mode='pending' onCancel={onCancel} onRetry={onRetry} /> : null}

      {statusCopy ? <StatusCard copy={statusCopy} /> : null}
    </ConnectScreenShell>
  )
}
