import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Bolt, Flame, Settings, Sword, Trophy, Zap } from 'lucide-react'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { InviteOverlay, LobbyMember, RolePicker, useLobby } from '@/features/lobby'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { useQueueStore } from '@/features/queue/queue-store'
import { useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

type ModeCard = {
  defaultQueueId: number | null
  description: string
  icon: React.ReactNode
  modeKey: string
  navigateTo: string | null
  title: string
}

function ModeIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-xl border border-lol-border-gold/40 bg-gradient-to-br from-lol-navy-800 to-lol-navy-950 shadow-lol-glow-gold ${className ?? ''}`}>
      {children}
    </div>
  )
}

function getModeCards(t: (key: string) => string): ModeCard[] {
  return [
    {
      modeKey: 'sr',
      defaultQueueId: 400,
      navigateTo: null,
      title: t('lobby.modes.sr'),
      description: t('lobby.modes.srDesc'),
      icon: <ModeIcon><Sword className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
    {
      modeKey: 'aram',
      defaultQueueId: 450,
      navigateTo: null,
      title: t('lobby.modes.aram'),
      description: t('lobby.modes.aramDesc'),
      icon: <ModeIcon><Zap className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
    {
      modeKey: 'swiftplay',
      defaultQueueId: 490,
      navigateTo: null,
      title: t('lobby.modes.swiftplay'),
      description: t('lobby.modes.swiftplayDesc'),
      icon: <ModeIcon><Bolt className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
    {
      modeKey: 'arena',
      defaultQueueId: 1700,
      navigateTo: null,
      title: t('lobby.modes.arena'),
      description: t('lobby.modes.arenaDesc'),
      icon: <ModeIcon><Flame className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
    {
      modeKey: 'tft',
      defaultQueueId: 1090,
      navigateTo: null,
      title: t('lobby.modes.tft'),
      description: t('lobby.modes.tftDesc'),
      icon: <ModeIcon><Trophy className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
    {
      modeKey: 'custom',
      defaultQueueId: null,
      navigateTo: '/connected/custom',
      title: t('lobby.modes.custom'),
      description: t('lobby.modes.customDesc'),
      icon: <ModeIcon><Settings className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
    {
      modeKey: 'clash',
      defaultQueueId: null,
      navigateTo: '/connected/clash',
      title: t('lobby.modes.clash'),
      description: t('lobby.modes.clashDesc'),
      icon: <ModeIcon><Award className="h-7 w-7 text-lol-gold" /></ModeIcon>,
    },
  ]
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
  const [remainingDodgePenalty, setRemainingDodgePenalty] = useState(dodgePenalty)
  const setDodgePenalty = useQueueStore((state) => state.setDodgePenalty)
  const isSwiftplay = mode === 'swiftplay'
  const isSwiftplayConfigured = useSwiftplayStore((state) => state.isValid)
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && rolePreferences.second !== 'UNSELECTED'
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = remainingDodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const isInLobby = members.length > 0 || isLoading
  const playModeCards = useMemo(() => getModeCards(t), [t])

  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(() => ({ code, enabled: shouldConnect && code.length > 0 }), [code, shouldConnect])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)

  const createLobbyMutation = useMutation({
    mutationFn: async (queueId: number) => {
      if (!transport) throw new Error('No transport')
      const result = await transport.request(LcuPaths.lobby.lobby, LcuHttpMethod.POST, { queueId })
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU request failed (${result.status})`)
      }
      return result
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lcu', LcuPaths.lobby.lobby] })
    },
  })

  const queueLabel = queueStatus.isSearching
    ? `${t('queue.searching')}${queueStatus.searchState ? ` (${queueStatus.searchState})` : ''}`
    : t('queue.notInQueue')
  const joinQueueLabel = isDodgePenaltyActive
    ? t('queue.dodgePenalty', { time: formatSeconds(remainingDodgePenalty) })
    : isSwiftplay
      ? t('swiftplay.enterQueue')
      : t('queue.findMatch')

  useEffect(() => {
    setRemainingDodgePenalty(dodgePenalty)
  }, [dodgePenalty])

  useEffect(() => {
    if (remainingDodgePenalty <= 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setRemainingDodgePenalty((current) => {
        const next = Math.max(0, current - 1)
        if (next === 0) {
          setDodgePenalty(0)
        }

        return next
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [remainingDodgePenalty, setDodgePenalty])

  function handleSelectMode(card: ModeCard) {
    if (card.navigateTo) {
      void navigate({ to: card.navigateTo })
      return
    }
    if (card.defaultQueueId !== null) {
      createLobbyMutation.mutate(card.defaultQueueId)
    }
  }

  if (!isInLobby) {
    return (
      <main className="space-y-6">
        <section className="space-y-2">
          <h2 className="font-display text-3xl tracking-wider text-lol-gold">{t('lobby.playTitle')}</h2>
          <p className="text-sm text-lol-text-muted">{t('lobby.playSubtitle')}</p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playModeCards.map((card) => (
            <button
              key={card.modeKey}
              type="button"
              disabled={createLobbyMutation.isPending}
              onClick={() => handleSelectMode(card)}
              className="group relative overflow-hidden rounded-xl border border-lol-border-subtle bg-lol-navy-900/60 p-5 text-left transition-all duration-200 hover:border-lol-border-gold hover:shadow-lol-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-60"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-display text-lg tracking-wider text-lol-gold">{card.title}</h3>
                  <p className="text-sm text-lol-text-muted">{card.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-lol-text-secondary transition-colors group-hover:text-lol-gold">
                <span className="uppercase tracking-wider">
                  {card.navigateTo ? t('lobby.open') : t('lobby.play')}
                </span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>
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
                  <p className="mt-4 font-display text-lg text-red-300">{t('queue.dodgePenalty', { time: formatSeconds(remainingDodgePenalty) })}</p>
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

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
})
