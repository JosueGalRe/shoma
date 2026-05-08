import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { useTranslation } from 'react-i18next'

import { Button, BottomSheet, Spinner, Alert, AlertDescription } from '@/components/ui'
import { useCreateLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, lobbyDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { ensureLcuRouteData } from '@/core/rift/route-loader'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'

// Community Dragon CDN base URL for game mode assets
const CD_CDN = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets'

// Map mode IDs to their CDN icon paths
const modeIconMap: Record<string, string> = {
  sr: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
  aram: `${CD_CDN}/aram/img/game-select-icon-default.png`,
  tft: `${CD_CDN}/tft/img/game-select-icon-default.png`,
  arena: `${CD_CDN}/cherry/img/game-select-icon-default.png`,
  rgm: `${CD_CDN}/shared/img/icon-rgm-empty.png`,
}

type GameMode = {
  id: string
  nameKey: string
  descriptionKey: string
  queues: GameQueue[]
}

function groupQueuesByMode(queues: GameQueue[], defaultGameQueues: number[]): GameMode[] {
  const modesMap: Record<string, GameMode> = {
    sr: {
      id: 'sr',
      nameKey: 'createLobby.modes.sr',
      descriptionKey: 'createLobby.modeDescriptions.sr',
      queues: [],
    },
    aram: {
      id: 'aram',
      nameKey: 'createLobby.modes.aram',
      descriptionKey: 'createLobby.modeDescriptions.aram',
      queues: [],
    },
    tft: {
      id: 'tft',
      nameKey: 'createLobby.modes.tft',
      descriptionKey: 'createLobby.modeDescriptions.tft',
      queues: [],
    },
    arena: {
      id: 'arena',
      nameKey: 'createLobby.modes.arena',
      descriptionKey: 'createLobby.modeDescriptions.arena',
      queues: [],
    },
    rgm: {
      id: 'rgm',
      nameKey: 'createLobby.modes.rgm',
      descriptionKey: 'createLobby.modeDescriptions.arena',
      queues: [],
    },
  }

  for (const queue of queues) {
    if (queue.mapId === 11 && queue.gameMode === 'CLASSIC') {
      modesMap.sr.queues.push(queue)
    } else if (queue.mapId === 12 && queue.gameMode === 'ARAM') {
      modesMap.aram.queues.push(queue)
    } else if (queue.mapId === 22 && queue.gameMode === 'TFT') {
      modesMap.tft.queues.push(queue)
    } else if (queue.mapId === 30 && queue.gameMode === 'CHERRY') {
      modesMap.arena.queues.push(queue)
    } else {
      modesMap.rgm.queues.push(queue)
    }
  }

  const modes = [modesMap.sr, modesMap.aram, modesMap.tft, modesMap.arena, modesMap.rgm].filter(m => m.queues.length > 0)

  for (const mode of modes) {
    mode.queues.sort((a, b) => {
      const aDefaultIndex = defaultGameQueues.indexOf(a.id)
      const bDefaultIndex = defaultGameQueues.indexOf(b.id)

      if (aDefaultIndex !== -1) {
        if (bDefaultIndex !== -1) return aDefaultIndex - bDefaultIndex
        return -1
      }
      if (bDefaultIndex !== -1) return 1
      return 0
    })
  }

  return modes
}

function CreateLobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()

  const transport = useSharedLCUTransport()

  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const enabledQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport))
  const defaultQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport))
  const lobbyQuery = useQuery(createLcuQueryOptions(lobbyDescriptor, transport))

  const createLobbyMutation = useCreateLobby(transport, queryClient)

  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const isLoading = queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading || lobbyQuery.isLoading
  const hasExistingLobby = lobbyQuery.isSuccess && ((lobbyQuery.data?.members?.length ?? 0) > 0)

  // DEBUG: log lobby detection state
  // eslint-disable-next-line no-console
  console.log('[Mimic Lobby Debug] lobbyQuery:', {
    isSuccess: lobbyQuery.isSuccess,
    isLoading: lobbyQuery.isLoading,
    isError: lobbyQuery.isError,
    error: lobbyQuery.error,
    data: lobbyQuery.data,
    membersLength: lobbyQuery.data?.members?.length ?? 'N/A',
    hasExistingLobby,
    rawCache: queryClient.getQueryData(['lcu', 'lobby', 'session']),
  })

  const handleCreateLobby = async (queueId: number) => {
    try {
      await createLobbyMutation.mutateAsync({ queueId })
      setIsSheetOpen(false)
      void navigate({ to: '/connected/lobby' })
    } catch {
      return
    }
  }

  const enabledGameQueues = useMemo(() => {
    if (!enabledQueuesQuery.data) return []
    return enabledQueuesQuery.data.split(',').map(Number)
  }, [enabledQueuesQuery.data])

  const defaultGameQueues = useMemo(() => {
    if (!defaultQueuesQuery.data) return []
    return defaultQueuesQuery.data.split(',').map(Number)
  }, [defaultQueuesQuery.data])

  const modes = useMemo(() => {
    if (!queuesQuery.data) return []

    const validQueues = queuesQuery.data.filter(
      (queue) => queue.category === 'PvP' && queue.queueAvailability === 'Available' && enabledGameQueues.includes(queue.id)
    )

    return groupQueuesByMode(validQueues, defaultGameQueues)
  }, [queuesQuery.data, enabledGameQueues, defaultGameQueues])

  return (
    <main className="flex h-full flex-col space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-display font-bold text-lol-gold">{t('createLobby.title')}</h2>
        <p className="text-sm text-lol-text-muted">{t('createLobby.selectQueue')}</p>
      </section>

      {hasExistingLobby && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void navigate({ to: '/connected/lobby' })}
        >
          {t('createLobby.backToLobby')}
        </Button>
      )}

      {isLoading ? (
        <p className="text-sm text-lol-text-muted">{t('createLobby.loading')}</p>
      ) : modes.length === 0 ? (
        <p className="text-sm text-lol-text-muted">{t('createLobby.noQueues')}</p>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center min-h-0 px-3">
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-label={t(mode.nameKey)}
                onClick={() => { setSelectedMode(mode); setIsSheetOpen(true); }}
                className="relative flex flex-col items-center justify-center rounded-xl border border-lol-border-subtle bg-lol-navy-900/80 p-4 transition-all hover:border-lol-border-gold hover:shadow-lol-glow-gold active:scale-[0.98] aspect-[4/3]"
              >
                <div className="flex items-center justify-center mb-1 w-12 h-12">
                  <img
                    src={modeIconMap[mode.id]}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-lol-text-primary text-center">{t(mode.nameKey)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={selectedMode ? t(selectedMode.nameKey) : ''}
      >
        {selectedMode && (
          <div className="space-y-2">
            {selectedMode.queues.map((queue) => (
              <Button
                key={queue.id}
                variant="secondary"
                className="w-full justify-start h-12"
                onClick={() => handleCreateLobby(queue.id)}
                disabled={createLobbyMutation.isPending}
              >
                {createLobbyMutation.isPending && createLobbyMutation.variables?.queueId === queue.id ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : null}
                {queue.description}
              </Button>
            ))}
            
            {createLobbyMutation.isError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{t('createLobby.createError')}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </BottomSheet>
    </main>
  )
}

export const Route = createFileRoute('/connected/create-lobby')({
  component: CreateLobbyRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
      lobbyDescriptor,
    ])
  },
})
