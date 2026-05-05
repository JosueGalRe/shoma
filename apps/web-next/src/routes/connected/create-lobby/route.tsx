import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LcuPaths } from '@mimic/protocol-contract'

import { Button, Card } from '@/components/ui'
import { useCreateLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'

type MappedQueueList = Record<string, GameQueue[]>

function CreateLobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(() => ({ code, enabled: shouldConnect && code.length > 0 }), [code, shouldConnect])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)

  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const enabledQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport))
  const defaultQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport))

  const [pendingQueueId, setPendingQueueId] = useState<number | null>(null)
  const createLobbyMutation = useCreateLobby(transport, queryClient)

  useEffect(() => {
    if (pendingQueueId === null) {
      return
    }

    console.log('[Mimic] CreateLobby route: creating lobby with queueId:', pendingQueueId)
    console.log('[Mimic] CreateLobby route: transport available:', !!transport)

    createLobbyMutation
      .mutateAsync({ queueId: pendingQueueId })
      .then((result) => {
        console.log('[Mimic] CreateLobby route: lobby created successfully:', result)
        void navigate({ to: '/connected/lobby' })
      })
      .catch((error: unknown) => {
        console.error('[Mimic] CreateLobby route: failed to create lobby:', error)
      })
      .finally(() => {
        setPendingQueueId(null)
      })
  }, [createLobbyMutation, navigate, pendingQueueId, transport])

  const enabledGameQueues = useMemo(() => {
    if (!enabledQueuesQuery.data) return []
    return enabledQueuesQuery.data.split(',').map(Number)
  }, [enabledQueuesQuery.data])

  const defaultGameQueues = useMemo(() => {
    if (!defaultQueuesQuery.data) return []
    return defaultQueuesQuery.data.split(',').map(Number)
  }, [defaultQueuesQuery.data])

  const availableQueues = useMemo(() => {
    if (!queuesQuery.data) return {}

    const ret: MappedQueueList = {}

    for (const queue of queuesQuery.data) {
      if (queue.category !== 'PvP') continue
      if (queue.queueAvailability !== 'Available' || !enabledGameQueues.includes(queue.id)) continue

      const key = `${queue.mapId}-${queue.gameMode}`
      if (!ret[key]) ret[key] = []
      ret[key].push(queue)
    }

    for (const queues of Object.values(ret)) {
      queues.sort((a, b) => {
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

    return ret
  }, [queuesQuery.data, enabledGameQueues, defaultGameQueues])

  const sections = useMemo(() => {
    return Object.keys(availableQueues).sort((a, b) => {
      const [aMap, aGameMode] = a.split('-')
      const [bMap, bGameMode] = b.split('-')

      if (aMap === '11' && bMap !== '11') return -1
      if (bMap === '11') return 1
      if (aGameMode === 'CLASSIC' && bGameMode !== 'CLASSIC') return -1
      if (bGameMode === 'CLASSIC') return 1
      if (aGameMode === 'ARAM' && bGameMode !== 'ARAM') return -1
      if (bGameMode === 'ARAM') return 1
      return 0
    })
  }, [availableQueues])

  const isLoading = queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading

  function handleCreateLobby(queueId: number) {
    setPendingQueueId(queueId)
  }

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-display font-bold text-lol-gold">{t('createLobby.title')}</h2>
        <p className="text-sm text-lol-text-muted">{t('createLobby.selectQueue')}</p>
      </section>

      {isLoading ? (
        <p className="text-sm text-lol-text-muted">{t('createLobby.loading')}</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-lol-text-muted">{t('createLobby.noQueues')}</p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            const queues = availableQueues[section]
            const [, gameMode] = section.split('-')
            
            let iconName = 'rgm'
            if (section === '10-CLASSIC') iconName = 'tt'
            else if (section === '11-CLASSIC') iconName = 'sr'
            else if (section === '12-ARAM') iconName = 'ha'
            else if (section === '22-TFT') iconName = 'tft'

            const iconColors: Record<string, string> = {
              sr: 'bg-lol-navy-950 border border-lol-border-gold/40 text-lol-gold',
              ha: 'bg-lol-navy-950 border border-lol-border-gold/40 text-lol-gold',
              tt: 'bg-lol-navy-950 border border-lol-border-gold/40 text-lol-gold',
              tft: 'bg-lol-navy-950 border border-lol-border-gold/40 text-lol-gold',
              rgm: 'bg-lol-navy-950 border border-lol-border-gold/40 text-lol-gold',
            }
            const iconColor = iconColors[iconName] || 'bg-lol-navy-950 border border-lol-border-gold/40 text-lol-gold'

            return (
              <div key={section} className="space-y-3">
                <h3 className="text-lg font-display font-semibold text-lol-gold">
                  {t(`modes.${gameMode.toLowerCase()}`, { defaultValue: gameMode })}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {queues.map((queue) => (
                    <Card key={queue.id} className="overflow-hidden border-lol-border-subtle bg-lol-navy-900/80 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
                      <div className="flex items-center p-4 gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconColor} text-xs font-bold`}>
                          {iconName.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="truncate font-display font-medium text-lol-text-primary">{queue.description}</h4>
                          <p className="truncate text-xs text-lol-text-muted">ID: {queue.id}</p>
                        </div>
                        <Button 
                          onClick={() => handleCreateLobby(queue.id)}
                          disabled={createLobbyMutation.isPending}
                          variant="primary"
                          size="sm"
                        >
                          {t('createLobby.createLobby')}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

export const Route = createFileRoute('/connected/create-lobby')({
  component: CreateLobbyRouteComponent,
})
