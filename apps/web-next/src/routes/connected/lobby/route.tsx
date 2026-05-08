import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Flame, Mail, Settings, Sword, Trophy, Zap } from 'lucide-react'

import { Avatar, Badge, BottomNav, BottomSheet, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { useCreateLobby, useDeleteLobby } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { InviteOverlay, RolePicker, useLobby } from '@/features/lobby'
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
      icon: <ModeIcon><Sword className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (mapId === '12' && gameMode === 'ARAM') {
    return {
      title: t('lobby.modes.aram'),
      description: t('lobby.modes.aramDesc'),
      icon: <ModeIcon><Zap className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (mapId === '22' && gameMode === 'TFT') {
    return {
      title: t('lobby.modes.tft'),
      description: t('lobby.modes.tftDesc'),
      icon: <ModeIcon><Trophy className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  if (gameMode === 'CHERRY') {
    return {
      title: t('lobby.modes.arena'),
      description: t('lobby.modes.arenaDesc'),
      icon: <ModeIcon><Flame className="size-7 text-lol-gold" /></ModeIcon>,
    }
  }
  return {
    title: t(`modes.${gameMode.toLowerCase()}`, { defaultValue: gameMode }),
    description: '',
    icon: <ModeIcon><Flame className="size-7 text-lol-gold" /></ModeIcon>,
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
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false)
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false)
  const isSwiftplay = mode === 'swiftplay'
  const isSwiftplayConfigured = useSwiftplayStore(selectSwiftplayIsValid)
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && rolePreferences.second !== 'UNSELECTED'
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = dodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const isInLobby = members.length > 0 || isLoading

  const transport = useSharedLCUTransport()

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
      const enabledQueueIds = new Set(enabledGameQueues)
      const defaultQueueIndex = new Map(defaultGameQueues.map((id, index) => [id, index]))

      for (const queue of queues) {
        if (queue.category !== 'PvP') continue
        if (queue.queueAvailability !== 'Available' || !enabledQueueIds.has(queue.id)) continue

        const key = `${queue.mapId}-${queue.gameMode}`
        if (!ret[key]) ret[key] = []
        ret[key].push(queue)
      }

      for (const queues of Object.values(ret)) {
        queues.sort((a, b) => {
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
                          className="group flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-60"
                        >
                          <div className="size-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
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
                  <ModeIcon><Settings className="size-7 text-lol-gold" /></ModeIcon>
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
                  className="group flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                >
                  <div className="size-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
                  <span className="font-medium text-lol-text-primary transition-colors group-hover:text-lol-gold">
                    {t('lobby.open')}
                  </span>
                </button>
              </div>
              </Card>

              <Card className="flex flex-col overflow-hidden border-lol-border-subtle bg-lol-navy-900/60 transition-colors hover:border-lol-border-gold hover:shadow-lol-glow-gold">
              <div className="flex items-start gap-4 border-b border-lol-border-subtle/50 bg-lol-navy-900/80 p-5">
                <div className="shrink-0">
                  <ModeIcon><Award className="size-7 text-lol-gold" /></ModeIcon>
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
                  className="group flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-lol-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                >
                  <div className="size-2 shrink-0 rotate-45 border border-lol-gold transition-colors group-hover:bg-lol-gold" />
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
  <div className="flex flex-col h-full overflow-hidden">
    {/* Compact Header - Phase A */}
    <header className="shrink-0 flex items-center justify-between px-4 h-[50px] border-b border-lol-border-subtle/50">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg tracking-wider text-lol-gold">{t('lobby.title')}</h2>
        {!isConnected ? (
          <span className="text-[10px] text-yellow-400">{t('connection.status.connecting')}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]">
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
    </header>

    <section className="shrink-0 px-4 py-2">
      <div className={`rounded-xl border p-3 ${queueStatus.isSearching ? 'border-lol-gold/60 bg-lol-navy-800/80' : 'border-lol-border-subtle bg-lol-navy-900/60'}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${queueStatus.isSearching ? 'animate-pulse bg-lol-gold' : 'bg-lol-text-muted'}`} />
            <span className="text-sm font-medium text-lol-text-primary">
              {queueStatus.isSearching ? t('queue.searching') : t('queue.notInQueue')}
            </span>
          </div>
          {queueStatus.isSearching ? (
            <span className="font-display text-sm text-lol-gold">
              {t('queue.searching')}
            </span>
          ) : null}
        </div>

        {isSwiftplay && !isSwiftplayConfigured ? (
          <Button
            className="w-full"
            onClick={() => void navigate({ to: '/connected/swiftplay' })}
            variant="primary"
            size="sm"
          >
            {t('swiftplay.configure')}
          </Button>
        ) : queueStatus.isSearching ? (
          <Button
            className="w-full"
            onClick={actions.leaveQueue}
            disabled={!isConnected || isActionPending}
            variant="secondary"
            size="sm"
          >
            {t('queue.leave')}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={actions.joinQueue}
            disabled={!canJoinQueue}
            variant="primary"
            size="sm"
          >
            {joinQueueLabel}
          </Button>
        )}

        {isDodgePenaltyActive ? (
          <p className="mt-2 text-center text-xs text-red-300">{t('queue.dodgePenalty', { time: formatSeconds(dodgePenalty) })}</p>
        ) : null}
      </div>
    </section>

    {/* Action Error */}
    {actionError ? (
      <div className="shrink-0 px-4">
        <Card className="border-red-700 bg-red-950/40" aria-live="polite">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">{t('errors.generic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs pb-3">
            <p className="text-red-200">{translatedActionError ? t(translatedActionError.messageKey) : t(actionError, { defaultValue: actionError })}</p>
            {translatedActionError ? (
              <p className="text-red-300">
                {translatedActionError.affectedSummoner ? `${translatedActionError.affectedSummoner}: ` : ''}
                {t(translatedActionError.actionKey)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    ) : null}

    {/* Members Horizontal Strip - Phase C */}
    <section className="shrink-0 px-4 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-lol-text-secondary">
          {t('lobby.members')}{isOwner ? ` • ${t('lobby.youAreOwner')}` : ''}
        </p>
        <span className="text-[10px] text-lol-text-muted">{members.length}</span>
      </div>
      
      {isLoading && members.length === 0 ? (
        <p className="text-xs text-lol-text-muted">{t('lobby.loading')}</p>
      ) : members.length === 0 && !isLoading ? (
        <p className="text-xs text-lol-text-muted">{t('lobby.noMembers')}</p>
      ) : (
        <ul 
          className="flex gap-2 overflow-x-auto pb-1 snap-x"
          role="list"
          aria-label={t('lobby.members')}
        >
          {members.map((member) => (
            <li 
              key={member.summonerId}
              role="listitem"
              className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-lol-border-subtle bg-lol-navy-900/40 p-2 w-[72px]"
              aria-label={`${t('lobby.member')}: ${member.displayName}, ${member.isLeader ? t('lobby.owner') : t('lobby.member')}`}
            >
              <Avatar alt={member.displayName} src={member.iconUrl ?? undefined} size="sm" />
              <span className="text-[10px] text-lol-text-primary truncate w-full text-center">
                {member.displayName}
              </span>
              {modeRules.requiresRoleSelection && (member.firstPositionPreference !== 'UNSELECTED' || member.secondPositionPreference !== 'UNSELECTED') ? (
                <div className="flex gap-0.5">
                  {member.firstPositionPreference !== 'UNSELECTED' ? (
                    <span className="text-[9px] text-lol-text-muted">{t(`lobby.roles.${member.firstPositionPreference.toLowerCase()}`)}</span>
                  ) : null}
                </div>
              ) : null}
              {isOwner && !member.isLocalMember ? (
                <div className="flex flex-col gap-1 w-full mt-1">
                  <Button
                    disabled={!isConnected || isActionPending}
                    onClick={() => actions.promotePlayer(member)}
                    size="sm"
                    variant="secondary"
                    className="h-8 min-h-[44px] text-[10px] px-1"
                  >
                    {t('lobby.promote')}
                  </Button>
                  <Button
                    disabled={!isConnected || isActionPending}
                    onClick={() => actions.kickPlayer(member)}
                    size="sm"
                    variant="destructive"
                    className="h-8 min-h-[44px] text-[10px] px-1"
                  >
                    {t('lobby.kick')}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>

    {/* Invite Player Button - compact inline */}
    <section className="shrink-0 px-4 py-2">
      <Button 
        className="w-full" 
        disabled={!isConnected || isActionPending || !canInvite} 
        onClick={() => setIsInviteOverlayOpen(true)} 
        variant="primary"
        size="sm"
      >
        {t('lobby.inviteOverlay.open')}
      </Button>
      {!canInvite ? <p className="mt-1 text-[10px] text-lol-text-muted text-center">{t('lobby.invitePermission')}</p> : null}
    </section>

    {/* Spacer to push BottomNav to bottom */}
    <div className="flex-1" />

    {/* BottomNav - Phase D */}
    <BottomNav
      items={[
        {
          id: 'roles',
          label: t('lobby.bottomNav.rolePreferences'),
          icon: <Award className="size-4 text-lol-text-secondary" />,
          onClick: () => setIsRoleSheetOpen(true),
        },
        {
          id: 'invites',
          label: t('lobby.bottomNav.invites'),
          icon: <Mail className="size-4 text-lol-text-secondary" />,
          badge: invites.length,
          onClick: () => setIsInviteSheetOpen(true),
        },
      ]}
    />

    {/* BottomSheet: Role Preferences - Phase E */}
    <BottomSheet
      isOpen={isRoleSheetOpen}
      onClose={() => setIsRoleSheetOpen(false)}
      title={t('lobby.rolePreferences')}
    >
      {modeRules.requiresRoleSelection ? (
        <div className="grid gap-3">
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
        </div>
      ) : (
        <p className="text-sm text-lol-text-muted">{t('lobby.rolePreferences')} {t('queue.notInQueue')}</p>
      )}
    </BottomSheet>

    {/* BottomSheet: Invites - Phase E */}
    <BottomSheet
      isOpen={isInviteSheetOpen}
      onClose={() => setIsInviteSheetOpen(false)}
      title={t('invites.title')}
    >
      <div className="space-y-4">
        {/* Received Invites */}
        {invites.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-lol-text-secondary mb-2">{t('invites.title')}</p>
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
          </div>
        ) : null}

        {/* Sent Invites */}
        {sentInvites.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-lol-text-secondary mb-2">{t('lobby.sentInvites')}</p>
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
          </div>
        ) : null}

      </div>
    </BottomSheet>

    {/* Invite Overlay (existing, unchanged) */}
    {isInviteOverlayOpen ? (
      <InviteOverlay
        canInvite={canInvite}
        isActionPending={isActionPending}
        isConnected={isConnected}
        onClose={() => setIsInviteOverlayOpen(false)}
        onInvite={actions.invitePlayer}
      />
    ) : null}
  </div>
)
}


export const Route = createFileRoute('/connected/lobby')({
  loader: async ({ context }) => {
    const [riftModule, lcuModule] = await Promise.all([
      import('@/core/rift/route-loader'),
      import('@/core/lcu/lcu-queries'),
    ])
    const { ensureLcuRouteData } = riftModule
    const { gameQueuesDescriptor, platformConfigDescriptor } = lcuModule
    await ensureLcuRouteData(context.queryClient, [
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
  component: LobbyRouteComponent,
})
