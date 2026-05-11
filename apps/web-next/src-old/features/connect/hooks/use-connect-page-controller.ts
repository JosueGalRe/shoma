import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { protocolHealthQueryOptions } from '../../../core/http/http-client'
import { useRiftStore } from '../../../core/rift/rift-store'
import type { ConnectionFormValues } from '../connect-types'
import { deriveStatusFlags, getStatusCopy, readInitialCode } from '../connect-utils'
import { useAutoConnectFromQuery } from './use-auto-connect-from-query'
import { useConnectedLcuInitialization } from './use-connected-lcu-initialization'
import { useConnectionFlow } from './use-connection-flow'
import { useRiftLcuRuntime } from './use-rift-lcu-runtime'

export function useConnectPageController() {
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
    setReadyCheckState,
    setInvites,
    setChampSelectState,
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
    setFormCode: (value) => setValue('code', value),
  })

  useConnectedLcuInitialization({
    appendLog,
    client,
    getMapName,
    getQueueDescription,
    lcuTransport,
    initializationFailedMessage: t(($) => $.connect.errors.lcuObserverInitFailed),
    setErrorBanner,
    setChampSelectState,
    setInvites,
    setLobbyDetails,
    setQueueState,
    setReadyCheckState,
    status,
  })

  useAutoConnectFromQuery({ handleConnect })

  const { isFailureState, isPendingState, shouldShowEntry } = deriveStatusFlags(status)

  return {
    code: code ?? '',
    codeError: errors.code,
    errorBanner,
    handleSubmit,
    isFailureState,
    isPendingState,
    onCancel: handleCancel,
    onRetry: handleRetry,
    onSubmit: handleConnectSubmit,
    register,
    shouldShowEntry,
    status,
    statusCopy,
  }
}
