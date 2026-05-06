import { Link, createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Flame, Settings, Sword, Trophy, Zap } from 'lucide-react'

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { useCreateLobby, useDeleteLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { InviteOverlay, LobbyMember, RolePicker, useLobby } from '@/features/lobby'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'

const EMPTY_QUEUES: Record<string, GameQueue[]> = {}

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

type MappedQueueList = Record<string, GameQueue[]>

function ModeIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-xl border border-lol-border-gold/40 bg-gradient-to-br from-lol-navy-800 to-lol-navy-950 shadow-lol-glow-gold ${className ?? ''}`}>
      {children}
    </div>
  )
}

function getGroupDetails(section: string, t: (key: string, options?: Record<string, unknown>) => string) {
  const [mapId, gameMode] = section.split('-')
  if (mapId === '11' && gameMode === 'CLASSIC') {
    return {
      title: t('lobby.modes.sr'),
      description: t('lobby.modes.srDesc'),
      icon: <ModeIcon><Sword className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (mapId === '12' && gameMode === 'ARAM') {
    return {
      title: t('lobby.modes.aram'),
      description: t('lobby.modes.aramDesc'),
      icon: <ModeIcon><Zap className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (mapId === '22' && gameMode === 'TFT') {
    return {
      title: t('lobby.modes.tft'),
      description: t('lobby.modes.tftDesc'),
      icon: <ModeIcon><Trophy className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (gameMode === 'CHERRY') {
    return {
      title: t('lobby.modes.arena'),
      description: t('lobby.modes.arenaDesc'),
      icon: <ModeIcon><Flame className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    }
  }
  return {
    title: t(`modes.${gameMode.toLowerCase()}`, { defaultValue: gameMode }),
    description: '',
    icon: <ModeIcon><Flame className="h-7 w-7 text-lol-gold" /></ModeIcon>,
  }
}

function LobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    actionError,
    actions,
    canInvite,
    dodgePenalty,
    invites,
    isActionPending,
    isConnected,
    isLoading,
    isOwner,
    members,
    mode,
    queueStatus,
    rolePreferences,
    sentInvites,
  } = useLobby()
  const [isInviteOverlayOpen, setIsInviteOverlayOpen] = useState(false)
  const [createLobbyError, setCreateLobbyError] = useState<string | null>(null)
  const isSwiftplay = mode === 'swiftplay'
  const isSwiftplayConfigured = useSwiftplayStore(selectSwiftplayIsValid)
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && rolePreferences.second !== 'UNSELECTED'
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = dodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const isInLobby = members.length > 0 || isLoading

  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(() => ({ code, enabled: shouldConnect && code.length > 0 }), [code, shouldConnect])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)

  const enabledQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'), transport))
  const defaultQueuesQuery = useQuery(createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport))

  const enabledGameQueues = useMemo(() => {
    if (!enabledQueuesQuery.data) return []
    return enabledQueuesQuery.data.split(',').map(Number)
  }, [enabledQueuesQuery.data])

  const defaultGameQueues = useMemo(() => {
    if (!defaultQueuesQuery.data) return []
    return defaultQueuesQuery.data.split(',').map(Number)
  }, [defaultQueuesQuery.data])

  const queuesQuery = useQuery({
    ...createLcuQueryOptions(gameQueuesDescriptor, transport),
    select: (queues): MappedQueueList => {
      if (!queues) return {}

      const ret: MappedQueueList = {}

      for (const queue of queues) {
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
    },
  })
  const availableQueues = queuesQuery.data ?? EMPTY_QUEUES

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

  const createLobbyMutation = useCreateLobby(transport, queryClient)
  const deleteLobbyMutation = useDeleteLobby(transport, queryClient)

  const handleCreateLobby = async (queueId: number) => {
    try {
      setCreateLobbyError(null)
      if (isInLobby) {
        await deleteLobbyMutation.mutateAsync()
      }
      await createLobbyMutation.mutateAsync({ queueId })
    } catch (error) {
      setCreateLobbyError(error instanceof Error ? error.message : 'errors.generic')
    }
  }

  const queueLabel = queueStatus.isSearching
    ? `${t('queue.searching')}${queueStatus.searchState ? ` (${queueStatus.searchState})` : ''}`
    : t('queue.notInQueue')
  const joinQueueLabel = isDodgePenaltyActive
    ? t('queue.dodgePenalty', { time: formatSeconds(dodgePenalty) })
    : isSwiftplay
      ? t('swiftplay.enterQueue')
      : t('queue.findMatch')

  if (!isInLobby) {
    const isPlayScreenLoading = queuesQuery.isLoading || enabledQueuesQuery.isLoading || defaultQueuesQuery.isLoading

    return (
      <main className="space-y-6">
        <section className="space-y-2">
          <h2 className="font-display text-3xl tracking-wider text-lol-gold">{t('lobby.playTitle')}</h2>
          <p className="text-sm text-lol-text-muted">{t('lobby.playSubtitle')}</p>
        </section>

        {isPlayScreenLoading ? (
          <p className="text-sm text-lol-text-muted">{t('lobby.loading')}</p>
        ) : (
          <>
            {createLobbyError ? (
              <Card className="border-red-700 bg-red-950/40" aria-live="polite">
                <CardHeader>
                  <CardTitle>{t('errors.generic')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-red-200">
                  {t(createLobbyError, { defaultValue: createLobbyError })}
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {sections.map((section) => {
                const queues = availableQueues[section]
                const details = getGroupDetails(section, t)

                return (
                  <Card key={section} className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
                    <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
                      <div className="shrink-0">
                        {details.icon}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-display text-xl tracking-wider text-lol-gold">{details.title}</h3>
                        {details.description ? <p className="text-sm text-lol-text-muted">{details.description}</p> : null}
                      </div>
                    </div>
                    <div className="flex flex-col p-2">
                      {queues.map((queue) => (
                        <button
                          key={queue.id}
                          type="button"
                          disabled={createLobbyMutation.isPending}
                          onClick={() => void handleCreateLobby(queue.id)}
                          className="group flex items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-60"
                        >
                          <div className="h-2 w-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                          <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                            {queue.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card>
                )
              })}

              <Card className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
              <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
                <div className="shrink-0">
                  <ModeIcon><Settings className="h-7 w-7 text-lol-gold" /></ModeIcon>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-display text-xl tracking-wider text-lol-gold">{t('lobby.modes.custom')}</h3>
                  <p className="text-sm text-lol-text-muted">{t('lobby.modes.customDesc')}</p>
                </div>
              </div>
              <div className="flex flex-col p-2">
                <button
                  type="button"
                  onClick={() => void navigate({ to: '/connected/custom' })}
                  className="group flex items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                >
                  <div className="h-2 w-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                  <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                    {t('lobby.open')}
                  </span>
                </button>
              </div>
              </Card>

              <Card className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
              <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
                <div className="shrink-0">
                  <ModeIcon><Award className="h-7 w-7 text-lol-gold" /></ModeIcon>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-display text-xl tracking-wider text-lol-gold">{t('lobby.modes.clash')}</h3>
                  <p className="text-sm text-lol-text-muted">{t('lobby.modes.clashDesc')}</p>
                </div>
              </div>
              <div className="flex flex-col p-2">
                <button
                  type="button"
                  onClick={() => void navigate({ to: '/connected/clash' })}
                  className="group flex items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                >
                  <div className="h-2 w-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                  <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                    {t('lobby.open')}
                  </span>
                </button>
              </div>
              </Card>
            </div>
          </>
        )}
      </main>
    )
  }

  return (
    <main className="space-y-4">
      <section className="space-y-2 rounded-xl border border-lol-border-subtle bg-lol-navy-900/70 p-4 shadow-lol-shadow-md backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-display text-2xl tracking-wider text-lol-gold">{t('lobby.title')}</h2>
            <p className="text-sm text-lol-text-muted">{t('lobby.noData')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
              {currentModeLabel}
            </Badge>
            <Button
              onClick={() => void navigate({ to: '/connected/create-lobby' })}
              size="sm"
              variant="secondary"
            >
              {t('lobby.changeMode')}
            </Button>
          </div>
        </div>

        {!isConnected ? <p className="rounded-md border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">{t('lobby.connecting')}</p> : null}
      </section>

      {actionError ? (
        <Card className="border-red-700 bg-red-950/40" aria-live="polite">
          <CardHeader>
            <CardTitle>{t('errors.generic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-red-200">{translatedActionError ? t(translatedActionError.messageKey) : t(actionError, { defaultValue: actionError })}</p>
            {translatedActionError ? (
              <p className="text-red-300">
                {translatedActionError.affectedSummoner ? `${translatedActionError.affectedSummoner}: ` : ''}
                {t(translatedActionError.actionKey)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('queue.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-lol-border-subtle bg-lol-navy-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-lol-text-secondary">{t('champSelect.phase')}</p>
                    <p className="font-display text-2xl text-lol-gold">{queueLabel}</p>
                  </div>
                  <Badge variant={queueStatus.isSearching ? 'outline' : 'secondary'}>
                    {queueStatus.isSearching ? 'Searching' : 'Idle'}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-lol-text-secondary">{t('queue.type')}</p>
                    <p className="mt-1 font-medium text-lol-text-primary">{currentModeLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-lol-text-secondary">{t('lobby.queueId')}</p>
                    <p className="mt-1 font-medium text-lol-text-primary">{queueStatus.queueId ?? '—'}</p>
                  </div>
                </div>
                {isDodgePenaltyActive ? (
                  <p className="mt-4 font-display text-lg text-red-300">{t('queue.dodgePenalty', { time: formatSeconds(dodgePenalty) })}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {isSwiftplay && !isSwiftplayConfigured ? (
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-lol-border-gold bg-lol-navy-800 px-4 py-2 text-sm font-medium text-lol-gold transition-all hover:bg-lol-navy-700 hover:shadow-lol-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                    to="/connected/swiftplay"
                  >
                    {t('swiftplay.configure')}
                  </Link>
                ) : (
                  <Button onClick={actions.joinQueue} disabled={!canJoinQueue} variant="primary">
                    {joinQueueLabel}
                  </Button>
                )}
                <Button onClick={actions.leaveQueue} disabled={!isConnected || isActionPending || !queueStatus.isSearching} variant="secondary">
                  {t('queue.leave')}
                </Button>
              </div>

              {isSwiftplay ? <p className="text-xs text-lol-text-muted">{isSwiftplayConfigured ? t('swiftplay.complete') : t('swiftplay.incomplete')}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t('lobby.members')}
                {isOwner ? ` (${t('lobby.youAreOwner')})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && members.length === 0 ? <p className="text-sm text-lol-text-muted">{t('lobby.loading')}</p> : null}
              {members.length === 0 && !isLoading ? <p className="text-sm text-lol-text-muted">{t('lobby.noMembers')}</p> : null}
              <ul className="space-y-3">
                {members.map((member) => (
                  <LobbyMember
                    key={member.summonerId}
                    isActionPending={isActionPending}
                    isConnected={isConnected}
                    isOwner={isOwner}
                    member={member}
                    onKick={actions.kickPlayer}
                    onPromote={actions.promotePlayer}
                    showRoles={modeRules.requiresRoleSelection}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('lobby.invitePlayer')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" disabled={!isConnected || isActionPending || !canInvite} onClick={() => setIsInviteOverlayOpen(true)} variant="primary">
                {t('lobby.inviteOverlay.open')}
              </Button>
              {!canInvite ? <p className="text-xs text-lol-text-muted">{t('lobby.invitePermission')}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('invites.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? <p className="text-sm text-lol-text-muted">{t('invites.none')}</p> : null}
              <ul className="space-y-2">
                {invites.map((invite) => (
                  <li key={invite.id} className="rounded-md border border-lol-border-subtle bg-lol-navy-900/40 p-3 text-sm text-lol-text-primary">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{invite.fromSummonerName}</span>
                      {invite.state ? <Badge variant="secondary">{invite.state}</Badge> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('lobby.sentInvites')}</CardTitle>
            </CardHeader>
            <CardContent>
              {sentInvites.length === 0 ? <p className="text-sm text-lol-text-muted">{t('invites.none')}</p> : null}
              <ul className="space-y-2">
                {sentInvites.map((invite) => (
                  <li key={invite.id} className="rounded-md border border-lol-border-subtle bg-lol-navy-900/40 p-3 text-sm text-lol-text-primary">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{invite.toSummonerName}</span>
                      {invite.state ? <Badge variant="secondary">{t(`lobby.inviteStatus.${invite.state.toLowerCase()}`)}</Badge> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {modeRules.requiresRoleSelection ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('lobby.rolePreferences')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <RolePicker
                  disabled={!isConnected || isActionPending}
                  label={t('lobby.primaryRole')}
                  onChange={(role) => actions.changeRole('first', role)}
                  value={rolePreferences.first}
                />
                <RolePicker
                  disabled={!isConnected || isActionPending}
                  label={t('lobby.secondaryRole')}
                  onChange={(role) => actions.changeRole('second', role)}
                  value={rolePreferences.second}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {isInviteOverlayOpen ? (
        <InviteOverlay
          canInvite={canInvite}
          isActionPending={isActionPending}
          isConnected={isConnected}
          onClose={() => setIsInviteOverlayOpen(false)}
          onInvite={actions.invitePlayer}
        />
      ) : null}
    </main>
  )
}

export const Route = createLazyFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
})
