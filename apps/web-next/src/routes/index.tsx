import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { protocolHealthQueryOptions } from '../core/http/http-client'
import { useRiftStore } from '../core/rift/rift-store'
import { ConnectScreen } from '../features/connect/components/connect-screen'
import type { ConnectionFormValues } from '../features/connect/connect-types'
import { deriveStatusFlags, getStatusCopy, readInitialCode } from '../features/connect/connect-utils'
import { useAutoConnectFromQuery } from '../features/connect/hooks/use-auto-connect-from-query'
import { useConnectedLcuInitialization } from '../features/connect/hooks/use-connected-lcu-initialization'
import { useConnectionFlow } from '../features/connect/hooks/use-connection-flow'
import { useRiftLcuRuntime } from '../features/connect/hooks/use-rift-lcu-runtime'

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
})

function IndexRouteComponent() {
  const { t } = useTranslation()

  const {
    status,
    client,
    queueState,
    errorBanner,
    setCode,
    setStatus,
    setClient,
    setPeer,
    setQueueState,
    setLobbyDetails,
    appendLog,
    setErrorBanner,
    resetLcuSession,
  } = useRiftStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConnectionFormValues>({
    defaultValues: {
      code: readInitialCode(),
    },
  })

  const code = watch('code')

  const statusCopy = useMemo(() => {
    return getStatusCopy(status, t)
  }, [status, t])

  useQuery(protocolHealthQueryOptions())

  useEffect(() => {
    return () => {
      if (client) {
        client.close()
      }
    }
  }, [client])

  const { getMapName, getQueueDescription, lcuTransport } = useRiftLcuRuntime({
    appendLog,
    client,
    setPeer,
    status,
  })

  useEffect(() => {
    if (queueState?.isCurrentlyInQueue) {
      document.body.classList.add('in-queue')
      return
    }

    document.body.classList.remove('in-queue')
  }, [queueState])

  const { handleCancel, handleConnect, handleConnectSubmit, handleRetry } = useConnectionFlow({
    appendLog,
    client,
    code: code ?? '',
    lcuTransport,
    resetLcuSession,
    setClient,
    setCode,
    invalidCodeLengthMessage: t(($) => $.connect.errors.invalidCodeLength),
    setErrorBanner,
    setStatus,
    setValue,
  })

  useConnectedLcuInitialization({
    appendLog,
    client,
    getMapName,
    getQueueDescription,
    lcuTransport,
    initializationFailedMessage: t(($) => $.connect.errors.lcuObserverInitFailed),
    setErrorBanner,
    setLobbyDetails,
    setQueueState,
    status,
  })

  useAutoConnectFromQuery({ handleConnect })

  const { isFailureState, isPendingState, shouldShowEntry } = deriveStatusFlags(status)

  return (
    <ConnectScreen
      code={code ?? ''}
      codeError={errors.code}
      errorBanner={errorBanner}
      handleSubmit={handleSubmit}
      isFailureState={isFailureState}
      isPendingState={isPendingState}
      onCancel={handleCancel}
      onRetry={handleRetry}
      onSubmit={handleConnectSubmit}
      register={register}
      shouldShowEntry={shouldShowEntry}
      status={status}
      statusCopy={statusCopy}
    />
  )
}
