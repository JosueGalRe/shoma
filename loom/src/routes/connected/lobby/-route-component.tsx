import { useState } from 'react'

import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useLobby } from '@/features/lobby'
import { LobbyCreationContent } from '@/features/lobby/components/lobby-creation-content'
import { RoleRankList } from '@/features/lobby/components/role-rank-list'
import { useLobbyJoinCode } from '@/features/lobby/hooks/use-lobby-join-code'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { useQueue } from '@/features/queue'
import { PremadeReadyCheckOverlay } from '@/features/ready-check/components/premade-ready-check-overlay'
import { formatPaddedMinutesSeconds } from '@/lib/format-time'

import { InGameScreen } from './-components/in-game-screen'
import { LobbyActionError } from './-components/lobby-action-error'
import { LobbyBackgroundEffects } from './-components/lobby-background-effects'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyMembersGrid } from './-components/lobby-members-grid'
import { LobbyModeButton } from './-components/lobby-mode-button'
import { LobbyOwnerCard } from './-components/lobby-owner-card'
import { LobbyQueueSection } from './-components/lobby-queue-section'
import { LobbyVisibilityToggle } from './-components/lobby-visibility-toggle'
import { ShareInviteButton } from './-components/share-invite-button'
import { useLobbyRolePreferences } from './-hooks/use-lobby-role-preferences'

export function LobbyRouteComponent() {
  const { t } = useTranslation()
  const { actionError, actions, isActionPending, isConnected, isSettingPartyType, viewModel } = useLobby()
  const { cancelQueue, gameflowPhase, isLowPriorityQueue, timer: queueTimer } = useQueue()
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const { copied, failed, isSharing, share } = useLobbyJoinCode()
  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false)
  const { handleFillToggle, handleSelectRole, handleSwapRankedRole, isFillSelected, isJadeLobby, rankedRoleOrder } =
    useLobbyRolePreferences({
      queueId: viewModel.queueId,
      rolePreferences: viewModel.rolePreferences,
      setRolePreferences: actions.setRolePreferences,
    })

  const handleSetPartyType = actions.setPartyType
  const handleJoinQueue = actions.joinQueue
  const handleCancelQueue = () => {
    void cancelQueue()
  }
  const handleSetLobbyInviteOverlayOpen = () => {
    setLobbyInviteOverlayOpen(true)
  }

  const currentModeLabel = t(getModeNameKey(viewModel.mode))
  const modeRules = getModeRules(viewModel.mode)
  const showSecondaryRole = !(viewModel.isLobbyFull && modeRules.requiresRoleSelection)
  const isSwiftplay = viewModel.mode === 'swiftplay'
  const isInReadyCheck = gameflowPhase === 'ReadyCheck'
  const isInGame = gameflowPhase === 'InProgress'
  const isSearching = viewModel.queueStatus.isSearching && !isInReadyCheck
  const searchLabel = isSearching ? `${t('queue.searching')} ${formatPaddedMinutesSeconds(queueTimer)}` : t('queue.notInQueue')

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
            <LobbyModeButton
              disabled={isSearching}
              isOwner={viewModel.isOwner}
              modeLabel={currentModeLabel}
              onSelect={() => {
                setIsModeSelectionOpen(true)
              }}
            />

            <LobbyVisibilityToggle
              disabled={isSearching}
              isLoading={isSettingPartyType}
              isOwner={viewModel.isOwner}
              onToggle={handleSetPartyType}
              partyType={viewModel.partyType}
            />

            {viewModel.hasLobby ? (
              <ShareInviteButton
                copied={copied}
                failed={failed}
                isSharing={isSharing}
                onShare={() => {
                  void share()
                }}
              />
            ) : null}
          </div>
        }
        title={t('lobby.title')}
      />

      <LobbyBackgroundEffects isSearching={viewModel.queueStatus.isSearching} />

      {mainCardMember ? <LobbyOwnerCard member={mainCardMember} isSearching={isSearching} /> : null}

      <LobbyMembersGrid
        members={others}
        isSearching={isSearching}
        showSecondaryRole={showSecondaryRole}
        canInvite={viewModel.canInvite}
        invitesCount={viewModel.invites.length}
        onOpenInvites={handleSetLobbyInviteOverlayOpen}
        t={t}
      />

      {actionError ? <LobbyActionError actionError={actionError} t={t} /> : null}

      <div className="flex-1" />

      {isJadeLobby ? (
        <section className="shrink-0 px-4 pb-2">
          <RoleRankList
            disabled={!isConnected || isActionPending || isSearching}
            fill={isFillSelected}
            onFillToggle={(fill) => {
              void handleFillToggle(fill)
            }}
            onSwap={(slotIndex, role) => {
              void handleSwapRankedRole(slotIndex, role)
            }}
            order={rankedRoleOrder}
            t={t}
          />
        </section>
      ) : null}

      <LobbyQueueSection
        isSearching={isSearching}
        canJoinQueue={viewModel.canJoinQueue}
        onCancelQueue={handleCancelQueue}
        onJoinQueue={handleJoinQueue}
        searchLabel={searchLabel}
        isLowPriorityQueue={isLowPriorityQueue}
        roleStrip={
          modeRules.requiresRoleSelection && !isJadeLobby
            ? {
                disabled: !isConnected || isActionPending,
                first: viewModel.rolePreferences.first,
                handleSelect: handleSelectRole,
                second: viewModel.rolePreferences.second,
              }
            : null
        }
        t={t}
      />

      <LobbyInviteOverlay />

      <PremadeReadyCheckOverlay isSwiftplay={isSwiftplay} />
    </div>
  )
}
