import { useState } from 'react'

import { Crown, LogOut, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { useQueue } from '@/features/queue'
import { PremadeReadyCheckOverlay } from '@/features/ready-check/components/premade-ready-check-overlay'
import { formatElapsedSeconds } from '@/hooks/use-elapsed-time'

import { InGameScreen } from './-components/in-game-screen'
import { LobbyBackgroundEffects } from './-components/lobby-background-effects'
import { LobbyBottomSheets } from './-components/lobby-bottom-sheets'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyMemberCard } from './-components/lobby-member-card'
import { LobbyVisibilityToggle } from './-components/lobby-visibility-toggle'
import { MemberRuneIcon } from './-components/member-rune-icon'
import { lobbyStyles } from './-styles'

export function LobbyRouteComponent() {
  const { t } = useTranslation()
  const { actionError, actions, isSettingPartyType, viewModel } = useLobby()
  const { cancelQueue, gameflowPhase, isLowPriorityQueue, timer: queueTimer } = useQueue()
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const setLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.setLobbyRoleSheetOpen)
  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false)
  const handleSetPartyType = actions.setPartyType
  const handleSetLobbyRoleSheetOpen = () => {
    setLobbyRoleSheetOpen(true)
  }
  const handleSetLobbyInviteSheetOpen = () => {
    setLobbyInviteSheetOpen(true)
  }
  const handleCancelQueue = () => {
    void cancelQueue()
  }
  const handleJoinQueue = actions.joinQueue
  const handleLeaveQueue = actions.leaveQueue
  const translatedActionError = actionError ? translateLcuError(actionError) : null
  const currentModeLabel = t(getModeNameKey(viewModel.mode))
  const modeRules = getModeRules(viewModel.mode)
  const showSecondaryRole = !(viewModel.isLobbyFull && modeRules.requiresRoleSelection)
  const isSwiftplay = viewModel.mode === 'swiftplay'
  const isInReadyCheck = gameflowPhase === 'ReadyCheck'
  const isInGame = gameflowPhase === 'InProgress'
  const isSearching = viewModel.queueStatus.isSearching && !isInReadyCheck
  const searchLabel = isSearching ? `${t('queue.searching')} ${formatElapsedSeconds(queueTimer)}` : t('queue.notInQueue')

  if (isInGame) {
    return <InGameScreen mode={viewModel.mode} />
  }

  if (!viewModel.hasLobby || isModeSelectionOpen) {
    return (
      <LobbyCreationContent
        currentMode={viewModel.mode}
        currentQueueId={viewModel.queueId ?? undefined}
        hasLobby={viewModel.hasLobby}
        onBackToLobby={() => {
          return setIsModeSelectionOpen(false)
        }}
        onCreated={() => {
          setIsModeSelectionOpen(false)
        }}
        showBackToLobby={viewModel.hasLobby}
      />
    )
  }

  const mainCardMember =
    viewModel.members.find((member) => {
      return member.isLocalMember
    }) ?? viewModel.members[0]
  const others = viewModel.members.filter((member) => {
    return member.summonerId !== mainCardMember?.summonerId
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <LobbyVisibilityToggle
              disabled={isSearching}
              isLoading={isSettingPartyType}
              isOwner={viewModel.isOwner}
              onToggle={handleSetPartyType}
              partyType={viewModel.partyType}
            />

            {viewModel.isOwner && (
              <button
                className="flex h-8 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] px-3 text-[10px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase backdrop-blur-md transition-all hover:bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)]"
                disabled={isSearching}
                onClick={() => {
                  setIsModeSelectionOpen(true)
                }}
                type="button"
              >
                <LogOut className="size-3" />

                <span>{t('lobby.changeMode')}</span>
              </button>
            )}
          </div>
        }
        badges={[{ label: currentModeLabel }]}
        title={t('lobby.title')}
      />

      <LobbyBackgroundEffects isSearching={viewModel.queueStatus.isSearching} />

      <section className="shrink-0 p-4">
        {mainCardMember ? (
          <button
            className={lobbyStyles.ownerCard}
            disabled={isSearching || !modeRules.requiresRoleSelection}
            onClick={modeRules.requiresRoleSelection ? handleSetLobbyRoleSheetOpen : undefined}
            type="button"
          >
            {modeRules.requiresRoleSelection ? (
              <div className={lobbyStyles.ownerPencilIcon}>
                <Pencil className="size-3.5" />
              </div>
            ) : null}

            <div className="relative">
              <div className={lobbyStyles.ownerAvatarContainer}>
                <img
                  alt={mainCardMember.displayName}
                  className="h-full w-full object-cover"
                  src={mainCardMember.iconUrl ?? undefined}
                />
              </div>

              {mainCardMember.isLeader ? (
                <div className={lobbyStyles.ownerCrownIcon}>
                  <Crown className="size-3 text-[rgb(200,170,110)]" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-center text-base font-bold text-[rgb(200,170,110)]">{mainCardMember.displayName}</span>

              {modeRules.requiresRoleSelection ? (
                <div className="flex items-center gap-2">
                  {mainCardMember.firstPositionPreference !== 'UNSELECTED' && (
                    <MemberRuneIcon role={mainCardMember.firstPositionPreference} />
                  )}

                  {showSecondaryRole &&
                    mainCardMember.secondPositionPreference !== 'UNSELECTED' &&
                    mainCardMember.firstPositionPreference !== 'FILL' && (
                      <MemberRuneIcon role={mainCardMember.secondPositionPreference} />
                    )}
                </div>
              ) : null}
            </div>
          </button>
        ) : null}
      </section>

      <section className="shrink-0 px-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          {others.map((member) => {
            return (
              <div
                key={member.summonerId}
                className={`${lobbyStyles.memberCardContainer} ${isSearching ? lobbyStyles.memberCardSearching : ''}`}
              >
                <LobbyMemberCard member={member} showSecondaryRole={showSecondaryRole} />
              </div>
            )
          })}
        </div>

        {viewModel.canInvite ? (
          <button className={lobbyStyles.inviteButton} onClick={handleSetLobbyInviteSheetOpen} type="button">
            <div className="relative">
              <Plus className="size-6" />

              {viewModel.invites.length > 0 ? (
                <span className={lobbyStyles.inviteBadge}>{viewModel.invites.length}</span>
              ) : null}
            </div>

            <span className="text-sm font-medium">{t('lobby.bottomNav.invites')}</span>
          </button>
        ) : null}
      </section>

      {actionError ? (
        <div className="shrink-0 px-4">
          <Card aria-live="polite" className="border-destructive bg-destructive/10 backdrop-blur-md">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">{t('errors.generic')}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-1 pb-3 text-xs">
              <p className="text-destructive">
                {translatedActionError ? t(translatedActionError.messageKey) : t(actionError, { defaultValue: actionError })}
              </p>

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

      <section className="shrink-0 p-4">
        <div className="relative">
          <div className={`${lobbyStyles.queueWave} ${viewModel.queueStatus.isSearching ? 'opacity-100' : 'opacity-0'}`} />

          <div className={lobbyStyles.queueContainer}>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isSearching ? lobbyStyles.queueStatusDotSearching : lobbyStyles.queueStatusDotIdle}`}
                />

                <span className={lobbyStyles.queueSearchLabel}>{searchLabel}</span>
              </div>

              {isLowPriorityQueue ? (
                <span className="text-[10px] font-bold tracking-wider text-[rgb(232,64,87)] uppercase">
                  {t('queue.lowPriority')}
                </span>
              ) : null}
            </div>

            {isSearching ? (
              <button className={lobbyStyles.cancelButton} onClick={handleCancelQueue} type="button">
                {t('queue.cancel')}
              </button>
            ) : (
              <div className="flex w-full items-center gap-3">
                <button
                  className={lobbyStyles.findMatchButton}
                  disabled={!viewModel.canJoinQueue}
                  onClick={handleJoinQueue}
                  type="button"
                >
                  {t('queue.findMatch')}
                </button>

                <button className={lobbyStyles.leaveButton} disabled={!isSearching} onClick={handleLeaveQueue} type="button">
                  {t('queue.leave')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <LobbyBottomSheets />

      <LobbyInviteOverlay />

      <PremadeReadyCheckOverlay isSwiftplay={isSwiftplay} />
    </div>
  )
}
