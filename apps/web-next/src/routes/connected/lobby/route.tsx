import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Award, Mail } from 'lucide-react'

import { BottomNav, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'
import { ensureLcuRouteData } from '@/core/rift/route-loader'
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

import { LobbyHeader } from './-components/lobby-header'
import { LobbyQueueCard } from './-components/lobby-queue-card'
import { LobbyMembersStrip } from './-components/lobby-members-strip'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'

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
    isLobbyLoading,
    isLobbyFetching,
    isOwner,
    members,
    mode,
    queueStatus,
    rolePreferences,
    sentInvites,
  } = useLobby()
  const [isInviteOverlayOpen, setIsInviteOverlayOpen] = useState(false)
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false)
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false)
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

    if (gameflowPhase === 'None' || gameflowPhase === 'ChampSelect') {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
      setIsLobbyGracePeriodActive(false)
      return
    }

    if (queueStatus.isSearching) {
      if (lobbyGraceTimerRef.current) {
        clearTimeout(lobbyGraceTimerRef.current)
        lobbyGraceTimerRef.current = null
      }
      setIsLobbyGracePeriodActive(false)
      return
    }

    if (!wasSearching) {
      return
    }

    setIsLobbyGracePeriodActive(true)

    if (lobbyGraceTimerRef.current) {
      clearTimeout(lobbyGraceTimerRef.current)
    }

    lobbyGraceTimerRef.current = setTimeout(() => {
      lobbyGraceTimerRef.current = null
      setIsLobbyGracePeriodActive(false)
    }, 3_000)
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
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && rolePreferences.second !== 'UNSELECTED'
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const isDodgePenaltyActive = dodgePenalty > 0
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && !isDodgePenaltyActive && (!modeRules.requiresRoleSelection || hasRequiredRoles)
  const currentModeLabel = t(getModeNameKey(mode))
  const hasLobby = members.length > 0 || queueStatus.isSearching || isLobbyGracePeriodActive

  if (!hasLobby && (isLobbyLoading || isLobbyFetching)) {
    return <div className="flex h-full items-center justify-center"><p className="text-lol-text-muted">{t('lobby.loading')}</p></div>
  }

  if (!hasLobby) {
    return <LobbyCreationContent />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <LobbyHeader
        isConnected={isConnected}
        currentModeLabel={currentModeLabel}
      />

      <LobbyQueueCard
        queueStatus={queueStatus}
        gameMode={{ isSwiftplay, isSwiftplayConfigured }}
        session={{ isConnected, isActionPending }}
        canJoinQueue={canJoinQueue}
        dodgePenalty={{ isActive: isDodgePenaltyActive, remainingSeconds: dodgePenalty }}
        onJoinQueue={actions.joinQueue}
        onLeaveQueue={actions.leaveQueue}
      />

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

      <LobbyMembersStrip
        members={members}
        modeRules={modeRules}
        sessionState={{
          isOwner,
          isLoading,
          isConnected,
          isActionPending,
        }}
        onPromotePlayer={actions.promotePlayer}
        onKickPlayer={actions.kickPlayer}
      />

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

      <LobbyBottomSheets
        sheets={{
          isRoleSheetOpen,
          setIsRoleSheetOpen,
          isInviteSheetOpen,
          setIsInviteSheetOpen,
        }}
        modeRules={modeRules}
        session={{ isConnected, isActionPending }}
        rolePreferences={rolePreferences}
        onChangeRole={actions.changeRole}
        invites={invites}
        sentInvites={sentInvites}
      />

      <LobbyInviteOverlay
        isInviteOverlayOpen={isInviteOverlayOpen}
        setIsInviteOverlayOpen={setIsInviteOverlayOpen}
        permissions={{ canInvite, isActionPending, isConnected }}
        onInvitePlayer={actions.invitePlayer}
      />
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
