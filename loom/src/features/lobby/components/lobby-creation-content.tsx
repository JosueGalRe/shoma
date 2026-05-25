import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useCreateLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'

import { LobbyCreationContentHeader } from './lobby-creation-content-header'
import { LobbyCreationContentModeCard } from './lobby-creation-content-mode-card'
import { lobbyCreationContentStyles } from './lobby-creation-content-styles'
import { groupQueuesByMode, parseQueueIds } from './lobby-creation-content-utils'

import type { LobbyCreationContentProps } from './lobby-creation-content-types'

export function LobbyCreationContent({ onCreated, showBackToLobby, onBackToLobby }: LobbyCreationContentProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()

  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const enabledQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport),
  )
  const defaultQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport),
  )

  const createLobbyMutation = useCreateLobby()

  const [selectedModeId, setSelectedModeId] = useState<string | null>(null)
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null)

  const isLoading = queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading

  const handleCreateLobby = async (queueId: number) => {
    try {
      setSelectedQueueId(queueId)
      await createLobbyMutation.mutateAsync({ queueId })
      await onCreated?.()
    } catch {
      setSelectedQueueId(null)

      return
    }
  }

  const enabledGameQueues = useMemo(() => {
    return parseQueueIds(enabledQueuesQuery.data)
  }, [enabledQueuesQuery.data])

  const defaultGameQueues = useMemo(() => {
    return parseQueueIds(defaultQueuesQuery.data)
  }, [defaultQueuesQuery.data])

  const modes = useMemo(() => {
    if (!queuesQuery.data) {
      return []
    }

    const validQueues = queuesQuery.data.filter((queue) => {
      return queue.category === 'PvP' && queue.queueAvailability === 'Available' && enabledGameQueues.includes(queue.id)
    })

    return groupQueuesByMode(validQueues, defaultGameQueues)
  }, [queuesQuery.data, enabledGameQueues, defaultGameQueues])

  if (isLoading) {
    return (
      <div className={lobbyCreationContentStyles.loadingOrEmpty}>
        <p className={lobbyCreationContentStyles.loadingText}>{t('createLobby.loading')}</p>
      </div>
    )
  }

  if (modes.length === 0) {
    return (
      <div className={lobbyCreationContentStyles.loadingOrEmpty}>
        <p className={lobbyCreationContentStyles.loadingText}>{t('createLobby.noQueues')}</p>
      </div>
    )
  }

  return (
    <div className={lobbyCreationContentStyles.container}>
      <LobbyCreationContentHeader showBackToLobby={showBackToLobby} onBackToLobby={onBackToLobby} />

      <div className={lobbyCreationContentStyles.modeList}>
        {modes.map((mode) => {
          const isExpanded = selectedModeId === mode.id

          return (
            <LobbyCreationContentModeCard
              key={mode.id}
              mode={mode}
              isExpanded={isExpanded}
              onToggle={() => {
                return setSelectedModeId(isExpanded ? null : mode.id)
              }}
              onCreateLobby={handleCreateLobby}
              selectedQueueId={selectedQueueId}
              pendingQueueId={createLobbyMutation.variables?.queueId ?? null}
              isCreatingLobby={createLobbyMutation.isPending}
              hasCreateError={createLobbyMutation.isError}
            />
          )
        })}
      </div>
    </div>
  )
}
