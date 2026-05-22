import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Award, Crown, Mail } from 'lucide-react'

import { BottomNav, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'
import { ensureLcuRouteData } from '@/core/relay/route-loader'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import {
  createLcuQueryOptions,
  currentSummonerDescriptor,
  gameQueuesDescriptor,
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbySessionDescriptor,
  platformConfigDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  sentInvitesDescriptor,
} from '@/core/lcu/lcu-queries'

import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'
import { PremadeReadyCheckOverlay } from '@/features/ready-check/components/premade-ready-check-overlay'

function MemberRuneIcon({ role }: { role: string }) {
  const roleMap: Record<string, string> = {
    TOP: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    JUNGLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    MIDDLE: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    BOTTOM: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    UTILITY: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
    FILL: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png',
  }

  const url = roleMap[role]
  if (!url) return null

  return (
    <img
      alt={role}
      className="size-6 rounded-full border border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.8)]"
      src={url}
    />
  )
}

function LobbyMemberCard({ member }: { member: import('@/features/lobby/lobby-store').LobbyMember }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border border-[rgba(200,170,110,0.4)] shadow-[0_0_10px_rgba(200,170,110,0.15)] overflow-hidden">
          <img
            alt={member.displayName}
            className="h-full w-full object-cover"
            src={member.iconUrl ?? undefined}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-center font-medium text-xs text-[rgb(200,170,110)] truncate w-20">
          {member.displayName}
        </span>
        <div className="flex items-center gap-1">
          {member.firstPositionPreference !== 'UNSELECTED' && (
            <MemberRuneIcon role={member.firstPositionPreference} />
          )}
          {member.secondPositionPreference !== 'UNSELECTED' && member.firstPositionPreference !== 'FILL' && (
            <MemberRuneIcon role={member.secondPositionPreference} />
          )}
        </div>
      </div>
    </div>
  )
}

function LobbyRouteComponent() {
  const { t } = useTranslation()
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
  } = useLobby()
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const setLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.setLobbyRoleSheetOpen)
  const isSwiftplay = mode === 'swiftplay'
  const transport = useSharedLCUTransport()
  const gameflowPhaseQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const gameflowPhase = gameflowPhaseQuery.data ?? null
  const [isLobbyGracePeriodActive, setIsLobbyGracePeriodActive] = useState(false)
  const previousIsSearchingRef = useRef(queueStatus.isSearching)
  const lobbyGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wasSearching = previousIsSearchingRef.current
    previousIsSearchingRef.current = queueStatus.isSearching

    const shouldClear = gameflowPhase === 'None' || gameflowPhase === 'ChampSelect' || queueStatus.isSearching

    if (shouldClear) {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
      setIsLobbyGracePeriodActive(false)
    }

    if (!shouldClear && wasSearching) {
      setIsLobbyGracePeriodActive(true)

      lobbyGraceTimerRef.current = setTimeout(() => {
        lobbyGraceTimerRef.current = null
        setIsLobbyGracePeriodActive(false)
      }, 3_000)
    }

    return () => {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
    }
  }, [gameflowPhase, queueStatus.isSearching])

  useEffect(() => {
    return () => {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
    }
  }, [])

  const isSwiftplayConfigured = useSwiftplayStore(selectSwiftplayIsValid)
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && (rolePreferences.first === 'FILL' || rolePreferences.second !== 'UNSELECTED')
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = dodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const hasLobby = members.length > 0 || queueStatus.isSearching || isLobbyGracePeriodActive

  if (!hasLobby) {
    return <LobbyCreationContent />
  }

  const owner = members.find((m) => m.isLeader) ?? members[0]
  const others = members.filter((m) => m.summonerId !== owner?.summonerId)
  const isSearching = queueStatus.isSearching

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t('lobby.title')}
        badges={[
          { label: t('lobby.closed'), icon: <Lock className="size-3" /> },
          { label: currentModeLabel },
        ]}
      />

      <section className="shrink-0 px-4 py-4">
        {owner && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[rgba(200,170,110,0.2)] bg-[rgba(10,20,40,0.4)] p-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-2 border-[rgba(200,170,110,0.6)] shadow-[0_0_25px_rgba(200,170,110,0.3)] overflow-hidden">
                <img
                  alt={owner.displayName}
                  className="h-full w-full object-cover"
                  src={owner.iconUrl ?? undefined}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(200,170,110,0.5)] bg-[rgba(10,20,40,0.9)]">
                <Crown className="size-3 text-[rgb(200,170,110)]" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-center font-bold text-base text-[rgb(200,170,110)]">
                {owner.displayName}
              </span>
              <div className="flex items-center gap-1">
                {owner.firstPositionPreference !== 'UNSELECTED' && (
                  <MemberRuneIcon role={owner.firstPositionPreference} />
                )}
                {owner.secondPositionPreference !== 'UNSELECTED' && owner.firstPositionPreference !== 'FILL' && (
                  <MemberRuneIcon role={owner.secondPositionPreference} />
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="shrink-0 px-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          {others.map((member) => (
            <div
              key={member.summonerId}
              className="flex flex-col items-center gap-2 rounded-xl border border-[rgba(200,170,110,0.15)] bg-[rgba(10,20,40,0.3)] p-3"
            >
              <LobbyMemberCard member={member} />
            </div>
          ))}
        </div>
      </section>

      {actionError ? (
        <div className="shrink-0 px-4">
          <Card className="border-destructive bg-destructive/10" aria-live="polite">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">{t('errors.generic')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs pb-3">
              <p className="text-destructive">{translatedActionError ? t(translatedActionError.messageKey) : t(actionError, { defaultValue: actionError })}</p>
              {translatedActionError ? (
                <p className="text-destructive">
                  {translatedActionError.affectedSummoner ? `${translatedActionError.affectedSummoner}: ` : ''}
                  {t(translatedActionError.actionKey)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex-1" />

      <section className="shrink-0 px-4 py-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.8)] p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isSearching ? 'bg-[rgb(200,170,110)] animate-pulse shadow-[0_0_8px_rgb(200,170,110)]' : 'bg-[rgba(200,170,110,0.3)]'}`} />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[rgba(200,170,110,0.9)]">
              {isSearching ? 'Searching...' : 'You are not in a queue.'}
            </span>
          </div>

          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              disabled={!canJoinQueue}
              onClick={actions.joinQueue}
              className={`flex-1 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                isSearching
                  ? 'border-[rgba(200,170,110,0.3)] bg-[rgba(10,20,40,0.6)] text-[rgba(200,170,110,0.5)]'
                  : 'border-[rgba(200,170,110,0.6)] bg-gradient-to-r from-[rgba(200,170,110,0.2)] to-[rgba(200,170,110,0.05)] text-[rgb(200,170,110)] hover:from-[rgba(200,170,110,0.3)] hover:to-[rgba(200,170,110,0.1)] hover:shadow-[0_0_25px_rgba(200,170,110,0.25)] active:scale-[0.98]'
              }`}
            >
              Find Match
            </button>
            <button
              type="button"
              onClick={actions.leaveQueue}
              disabled={!isSearching}
              className="flex-1 rounded-full border border-[rgba(200,170,110,0.4)] bg-[rgba(10,20,40,0.8)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[rgba(200,170,110,0.6)] transition-all hover:border-[rgba(200,170,110,0.6)] hover:bg-[rgba(200,170,110,0.1)] hover:text-[rgba(200,170,110,0.9)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Leave
            </button>
          </div>
        </div>
      </section>

      <BottomNav
        items={[
          {
            id: 'roles',
            label: t('lobby.bottomNav.rolePreferences'),
            icon: <Award className="size-4 text-muted" />,
            onClick: () => setLobbyRoleSheetOpen(true),
          },
          {
            id: 'invites',
            label: t('lobby.bottomNav.invites'),
            icon: <Mail className="size-4 text-muted" />,
            badge: invites.length,
            onClick: () => setLobbyInviteSheetOpen(true),
          },
        ]}
      />

      <LobbyBottomSheets />

      <LobbyInviteOverlay />
      <PremadeReadyCheckOverlay isSwiftplay={isSwiftplay} />
    </div>
  )
}

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      lobbySessionDescriptor,
      queueDescriptor,
      queueSearchDescriptor,
      invitesDescriptor,
      sentInvitesDescriptor,
      currentSummonerDescriptor,
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
})
