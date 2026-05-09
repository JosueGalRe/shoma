import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Mail } from 'lucide-react'

import { BottomNav, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { selectSwiftplayIsValid, useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'

import { LobbyHeader } from './-components/lobby-header'
import { LobbyQueueCard } from './-components/lobby-queue-card'
import { LobbyMembersStrip } from './-components/lobby-members-strip'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'

export type MappedQueueList = Record<string, GameQueue[]>

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
    sentInvites,
  } = useLobby()
  const [isInviteOverlayOpen, setIsInviteOverlayOpen] = useState(false)
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

  if (!isInLobby) {
    return <Navigate to="/connected/create-lobby" />
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
})
