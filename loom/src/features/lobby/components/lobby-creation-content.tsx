import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Spinner } from '@/components/ui'
import { useCreateLobby } from '@/core/lcu/lcu-mutations'
import {
  clashTournamentsDescriptor,
  createLcuQueryOptions,
  gameQueuesDescriptor,
  platformConfigDescriptor,
} from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { LobbyCreationContentHeader } from './lobby-creation-content-header'
import { LobbyCreationContentModeCard } from './lobby-creation-content-mode-card'
import { lobbyCreationContentStyles } from './lobby-creation-content-styles'
import { groupQueuesByMode, parseQueueIds } from './lobby-creation-content-utils'

import type { LobbyCreationContentProps } from './lobby-creation-content-types'

export function LobbyCreationContent({
  currentMode,
  currentQueueId,
  hasLobby,
  onCreated,
  showBackToLobby,
  onBackToLobby,
}: LobbyCreationContentProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()

  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const enabledQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport),
  )
  const defaultQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport),
  )
  const clashTournamentsQuery = useQuery(createLcuQueryOptions(clashTournamentsDescriptor, transport))

  const createLobbyMutation = useCreateLobby()

  const [selectedModeId, setSelectedModeId] = useState<string | null>(() => {
    if (!currentMode) {
      return null
    }

    if (currentMode === 'classic' || currentMode === 'swiftplay') {
      return 'sr'
    }

    if (currentMode === 'aram') {
      return 'aram'
    }

    if (currentMode === 'arena') {
      return 'arena'
    }

    if (currentMode === 'tft') {
      return 'tft'
    }

    if (currentMode === 'coop-vs-ai') {
      return 'coop'
    }

    if (currentMode === 'clash') {
      return 'clash'
    }

    return 'rgm'
  })
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(currentQueueId ?? null)

  const isLoading =
    queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading || clashTournamentsQuery.isLoading

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

  const defaultGameQueues = parseQueueIds(defaultQueuesQuery.data)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000
  const isClashVisible = (clashTournamentsQuery.data ?? []).some((tournament) => {
    const { scheduleTime } = tournament

    return scheduleTime !== undefined && scheduleTime >= startOfToday && scheduleTime < startOfTomorrow
  })

  const modes = (() => {
    if (!queuesQuery.data) {
      return []
    }

    const validQueues = queuesQuery.data.filter((queue) => {
      return (queue.category === 'PvP' || queue.category === 'VersusAi') && queue.queueAvailability === 'Available'
    })

    return groupQueuesByMode(validQueues, defaultGameQueues, isClashVisible)
  })()

  if (isLoading) {
    return (
      <div className={lobbyCreationContentStyles.loadingOrEmpty}>
        <Spinner className="text-primary size-8" />

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
      <LobbyCreationContentHeader hasLobby={hasLobby} onBackToLobby={onBackToLobby} showBackToLobby={showBackToLobby} />

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
