import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimatedModeIcon } from '@/components/animated-mode-icon'
import { Spinner, Alert, AlertDescription } from '@/components/ui'
import { useCreateLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'

const CD_CDN =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets'

type GameMode = {
  id: string
  nameKey: string
  descriptionKey: string
  iconUrl: string
  iconUrlActive: string
  videoUrlIntro?: string
  videoUrlActive?: string
  queues: GameQueue[]
}

function groupQueuesByMode(queues: GameQueue[], defaultGameQueues: number[]): GameMode[] {
  const modesMap: Record<string, GameMode> = {
    sr: {
      id: 'sr',
      nameKey: 'createLobby.modes.sr',
      descriptionKey: 'createLobby.modeDescriptions.sr',
      iconUrl: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/classic_sru/img/game-select-icon-active.png`,
      videoUrlIntro: `${CD_CDN}/classic_sru/video/game-select-icon-intro.webm`,
      videoUrlActive: `${CD_CDN}/classic_sru/video/game-select-icon-active.webm`,
      queues: [],
    },
    aram: {
      id: 'aram',
      nameKey: 'createLobby.modes.aram',
      descriptionKey: 'createLobby.modeDescriptions.aram',
      iconUrl: `${CD_CDN}/aram/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/aram/img/game-select-icon-active.png`,
      videoUrlIntro: `${CD_CDN}/aram/video/game-select-icon-intro.webm`,
      videoUrlActive: `${CD_CDN}/aram/video/game-select-icon-active.webm`,
      queues: [],
    },
    tft: {
      id: 'tft',
      nameKey: 'createLobby.modes.tft',
      descriptionKey: 'createLobby.modeDescriptions.tft',
      iconUrl: `${CD_CDN}/tft/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/tft/img/game-select-icon-active.png`,
      queues: [],
    },
    arena: {
      id: 'arena',
      nameKey: 'createLobby.modes.arena',
      descriptionKey: 'createLobby.modeDescriptions.arena',
      iconUrl: `${CD_CDN}/cherry/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/cherry/img/game-select-icon-active.png`,
      videoUrlIntro: `${CD_CDN}/cherry/video/game-select-icon-intro.webm`,
      videoUrlActive: `${CD_CDN}/cherry/video/game-select-icon-active.webm`,
      queues: [],
    },
    rgm: {
      id: 'rgm',
      nameKey: 'createLobby.modes.rgm',
      descriptionKey: 'createLobby.modeDescriptions.rgm',
      iconUrl: `${CD_CDN}/shared/img/icon-rgm-empty.png`,
      iconUrlActive: `${CD_CDN}/shared/img/icon-rgm-active.png`,
      videoUrlIntro: `${CD_CDN}/shared/video/game-select-icon-rgm-intro.webm`,
      videoUrlActive: `${CD_CDN}/shared/video/game-select-icon-rgm-active.webm`,
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

  const modes = [modesMap.sr, modesMap.aram, modesMap.tft, modesMap.arena, modesMap.rgm].filter((m) => m.queues.length > 0)
  const defaultQueueIndex = new Map(defaultGameQueues.map((id, index) => [id, index]))

  for (const mode of modes) {
    mode.queues.sort((a, b) => {
      const aDefaultIndex = defaultQueueIndex.get(a.id)
      const bDefaultIndex = defaultQueueIndex.get(b.id)

      if (aDefaultIndex !== undefined) {
        if (bDefaultIndex !== undefined) return aDefaultIndex - bDefaultIndex
        return -1
      }
      if (bDefaultIndex !== undefined) return 1
      return 0
    })
  }

  return modes
}

export type LobbyCreationContentProps = {
  onCreated?: () => void | Promise<void>
  showBackToLobby?: boolean
  onBackToLobby?: () => void
}

export function LobbyCreationContent({ onCreated, showBackToLobby, onBackToLobby }: LobbyCreationContentProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const transport = useSharedLCUTransport()

  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const enabledQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport),
  )
  const defaultQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport),
  )

  const createLobbyMutation = useCreateLobby(transport, queryClient)

  const [selectedModeId, setSelectedModeId] = useState<string | null>(null)
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null)

  const isLoading = queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading

  const handleCreateLobby = async (queueId: number) => {
    try {
      setSelectedQueueId(queueId)
      await createLobbyMutation.mutateAsync({ queueId })
      onCreated?.()
    } catch {
      setSelectedQueueId(null)
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
      (queue) => queue.category === 'PvP' && queue.queueAvailability === 'Available' && enabledGameQueues.includes(queue.id),
    )

    return groupQueuesByMode(validQueues, defaultGameQueues)
  }, [queuesQuery.data, enabledGameQueues, defaultGameQueues])

  if (isLoading) {
    return (
      <div className='flex h-full flex-col items-center justify-center'>
        <p className='text-muted text-sm'>{t('createLobby.loading')}</p>
      </div>
    )
  }

  if (modes.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center'>
        <p className='text-muted text-sm'>{t('createLobby.noQueues')}</p>
      </div>
    )
  }

  return (
    <div className='flex h-full w-full flex-col overflow-y-auto px-4 pt-4 pb-12'>
      <div className='mb-8 shrink-0'>
        <div className='flex items-center gap-4'>
          {showBackToLobby && onBackToLobby && (
            <button
              type='button'
              onClick={onBackToLobby}
              className='border-border-gold/30 bg-surface/60 text-text hover:border-primary/50 hover:bg-surface/80 hover:text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-[0_0_15px_rgba(200,170,110,0.15)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,170,110,0.3)]'
              aria-label={t('common.back', 'Back')}
            >
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='h-5 w-5'
              >
                <path d='M19 12H5M12 19l-7-7 7-7' />
              </svg>
            </button>
          )}
          <div className='flex flex-col'>
            <h1 className='font-display text-primary text-3xl font-black tracking-wider drop-shadow-[0_0_15px_rgba(200,170,110,0.4)]'>
              {t('createLobby.title', 'SELECT MODE')}
            </h1>
            <div className='from-primary mt-1 h-px w-20 bg-gradient-to-r to-transparent' />
          </div>
        </div>
      </div>

      <div className='flex w-full max-w-md flex-col gap-4 self-center pb-20'>
        {modes.map((mode) => {
          const isExpanded = selectedModeId === mode.id
          return (
            <div
              key={mode.id}
              className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-350 ${
                isExpanded
                  ? 'border-primary/50 bg-surface/80 shadow-[0_0_20px_rgba(200,170,110,0.2)]'
                  : 'border-border-gold/20 bg-surface/40 hover:border-primary/40 hover:bg-surface/60'
              } backdrop-blur-md`}
            >
              {isExpanded && (
                <div className='bg-primary absolute top-0 left-0 h-full w-1 shadow-[0_0_10px_rgba(200,170,110,0.8)]' />
              )}

              <button
                type='button'
                onClick={() => setSelectedModeId(isExpanded ? null : mode.id)}
                className='flex w-full items-center justify-between p-4 text-left'
              >
                <div className='flex items-center gap-4'>
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${isExpanded ? 'scale-110 shadow-[0_0_20px_rgba(200,170,110,0.4)]' : 'group-hover:scale-105'}`}
                  >
                    <AnimatedModeIcon mode={mode} isExpanded={isExpanded} />
                  </div>
                  <div className='flex min-w-0 flex-col items-start'>
                    <span
                      className={`text-base leading-tight font-bold tracking-wide transition-colors ${isExpanded ? 'text-primary' : 'text-text group-hover:text-primary/80'}`}
                    >
                      {t(mode.nameKey)}
                    </span>
                    <span className='text-muted/70 mt-0.5 text-xs tracking-widest uppercase'>{t(mode.descriptionKey)}</span>
                  </div>
                </div>
                <div
                  className={`text-muted flex h-5 w-5 items-center justify-center transition-transform duration-300 ${isExpanded ? 'text-primary rotate-180' : ''}`}
                >
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='h-4 w-4'
                  >
                    <polyline points='6 9 12 15 18 9'></polyline>
                  </svg>
                </div>
              </button>

              <div
                className={`grid transition-all duration-350 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className='overflow-hidden'>
                  <div className='flex flex-col gap-2 px-4 pt-2 pb-4'>
                    {mode.queues.map((queue, index) => {
                      const isQueueSelected = selectedQueueId === queue.id
                      const isQueuePending =
                        createLobbyMutation.isPending && createLobbyMutation.variables?.queueId === queue.id
                      return (
                        <button
                          key={queue.id}
                          type='button'
                          onClick={() => handleCreateLobby(queue.id)}
                          disabled={createLobbyMutation.isPending}
                          style={{ transitionDelay: isExpanded ? `${index * 40}ms` : '0ms' }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-250 ${
                            isExpanded ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                          } ${
                            isQueueSelected || isQueuePending
                              ? 'bg-primary/20 text-primary shadow-[inset_0_0_10px_rgba(200,170,110,0.2)]'
                              : 'text-text/80 hover:bg-surface/50 hover:text-text'
                          }`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center ${isQueueSelected || isQueuePending ? 'text-primary' : 'text-muted'}`}
                          >
                            {isQueuePending ? (
                              <Spinner className='h-3 w-3' />
                            ) : (
                              <svg viewBox='0 0 24 24' fill='currentColor' className='h-3 w-3 rotate-45'>
                                <rect x='4' y='4' width='16' height='16' />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium tracking-wide ${isQueueSelected || isQueuePending ? 'font-bold' : ''}`}
                          >
                            {queue.description}
                          </span>
                        </button>
                      )
                    })}

                    {createLobbyMutation.isError && (
                      <Alert variant='destructive' className='mt-2'>
                        <AlertDescription>{t('createLobby.createError')}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
