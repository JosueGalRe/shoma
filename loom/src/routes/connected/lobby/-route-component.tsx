import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { Switch } from '@shoma/ui/switch'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { useDismissEndOfGameStats, useSetQuickplayReady } from '@/core/lcu/lcu-mutations'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { LeaveLobbyModal } from '@/features/lobby/components/leave-lobby-modal'
import { useLobbyQueueArt } from '@/features/lobby/hooks/use-lobby-queue-art'
import { getQueueRestrictionMessage } from '@/features/lobby/utils/queue-restrictions'
import { getQuickPlayAction } from '@/features/lobby/utils/quick-play-slots'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { useQueue } from '@/features/queue'

import { DashboardScreen } from './-components/dashboard-screen'
import { type LobbyFooterMessage, LobbyFooterMessages } from './-components/lobby-footer-messages'
import { LobbyInviteSheet } from './-components/lobby-invite-sheet'
import { LobbyParty } from './-components/lobby-party'
import { LobbyQueueTimer } from './-components/lobby-queue-timer'
import { LobbyTitle } from './-components/lobby-title'
import { MatchStatusScreen } from './-components/match-status-screen'
import { useLobbyRegalia } from './-hooks/use-lobby-regalia'

// Figma lobby (Reclutamiento, Solo/Duo, Flex): the party over its map's art, and the search at the bottom
export function LobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { actionError, actions, isSettingPartyType, viewModel } = useLobby()
  const { cancelQueue, estimatedTime, gameflowPhase, isLowPriorityQueue, timer } = useQueue()
  const isInviteSheetOpen = useUiStore(uiStoreSelectors.isLobbyInviteOverlayOpen)
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const { backgroundUrl, description, iconUrl } = useLobbyQueueArt(viewModel.queueId)
  const regalia = useLobbyRegalia(viewModel.members)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const setQuickPlayReady = useSetQuickplayReady()
  const dismissEndOfGameStats = useDismissEndOfGameStats()
  const toast = useToast()

  // Reconnect: the game runs but the client lost it, which the client also shows as a game in progress
  if (gameflowPhase === 'InProgress' || gameflowPhase === 'Reconnect') {
    return <MatchStatusScreen message={t('lobby.matchInProgress')} />
  }

  if (gameflowPhase === 'WaitingForStats' || gameflowPhase === 'PreEndOfGame' || gameflowPhase === 'EndOfGame') {
    return (
      <MatchStatusScreen
        message={t('lobby.matchEnded')}
        onBack={() => {
          dismissEndOfGameStats.mutate()
        }}
      />
    )
  }

  if (!viewModel.hasLobby) {
    return <DashboardScreen />
  }

  const modeRules = getModeRules(viewModel.mode)
  const isSearching = viewModel.queueStatus.isSearching && gameflowPhase !== 'ReadyCheck'
  const translatedError = actionError ? translateLcuError(actionError) : null
  const isOpenParty = viewModel.partyType === 'open'
  const isQuickPlay = viewModel.mode === 'swiftplay'
  const isParty = viewModel.members.length > 1
  const localMember = viewModel.members.find((member) => {
    return member.isLocalMember
  })
  const quickPlayAction = isQuickPlay ? getQuickPlayAction(viewModel.members) : null
  // As in the client, what keeps the party out of matchmaking shows above the search
  const restrictionMessage = isSearching ? null : getQueueRestrictionMessage(viewModel.restrictions, localMember?.summonerId)
  const footerMessages: LobbyFooterMessage[] = []

  if (restrictionMessage) {
    footerMessages.push({ id: 'restriction', role: 'status', text: t(`lobby.restrictions.${restrictionMessage}`) })
  }

  if (actionError) {
    footerMessages.push({
      id: 'action-error',
      role: 'alert',
      text: t(translatedError?.messageKey ?? actionError, { defaultValue: actionError }),
    })
  }

  if (isLowPriorityQueue) {
    footerMessages.push({ id: 'low-priority', text: t('queue.lowPriority') })
  }

  function handleBack() {
    // As in the client, back is where the owner changes the mode; members can't, so for them it leaves the party
    if (viewModel.isOwner) {
      void navigate({ to: '/connected/create-lobby' })

      return
    }

    handleLeave()
  }

  function handleLeave() {
    if (isParty) {
      setIsLeaveModalOpen(true)

      return
    }

    void actions.deleteLobby()
  }

  const isTakingBackReady = isQuickPlay && isParty && Boolean(localMember?.isQuickPlayReady)

  function readCloseLabel() {
    return isTakingBackReady ? t('lobby.quickPlay.cancelReady') : t('lobby.leaveLobby')
  }

  // As in the client, a Swift Play party's X first takes back the player's ready (and quits the queue while searching)
  function handleClose() {
    if (isSearching) {
      void cancelQueue()
    }

    if (isTakingBackReady) {
      setQuickPlayReady.mutate(false)

      return
    }

    if (!isSearching) {
      handleLeave()
    }
  }

  // A Swift Play party readies up first; the leader's ready, once everyone else's is in, also finds the match
  function handleMainAction() {
    if (!isQuickPlay || !isParty) {
      void actions.joinQueue()

      return
    }

    setQuickPlayReady.mutate(true, {
      onSuccess: () => {
        if (localMember?.isLeader) {
          void actions.joinQueue()
        }
      },
    })
  }

  function readMainActionLabel() {
    if (quickPlayAction?.kind !== 'ready') {
      return t('queue.findMatch')
    }

    return quickPlayAction.playersReady > 0
      ? t('lobby.quickPlay.readyGroup', {
          playersReady: quickPlayAction.playersReady,
          totalPlayers: viewModel.members.length,
        })
      : t('lobby.quickPlay.ready')
  }

  function renderArchBottom() {
    if (isSearching || !viewModel.isOwner) {
      return null
    }

    return (
      <div {...props(styles.partyType)}>
        <Switch
          aria-label={t('lobby.openParty')}
          checked={isOpenParty}
          disabled={isSettingPartyType}
          icon={<Icon name="group" size={14} />}
          onCheckedChange={(checked) => {
            void actions.setPartyType(checked ? 'open' : 'closed')
          }}
        />

        <span aria-hidden {...props(text.marcellus11)}>
          {isOpenParty ? t('lobby.openParty') : t('lobby.closedParty')}
        </span>
      </div>
    )
  }

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground image={backgroundUrl} />

      <TopBar backDisabled={isSearching} onBack={handleBack} />

      <LobbyTitle
        iconUrl={iconUrl}
        label={description ?? t(getModeNameKey(viewModel.mode))}
        onChangeMode={
          viewModel.isOwner && !isSearching
            ? () => {
                void navigate({ to: '/connected/create-lobby' })
              }
            : undefined
        }
      />

      <LobbyParty
        canInvite={viewModel.canInvite}
        members={viewModel.members}
        quickPlay={isQuickPlay}
        regalia={regalia}
        showRoles={modeRules.requiresRoleSelection}
        size={modeRules.maxPartySize}
        onEditRoles={
          isSearching
            ? undefined
            : (slot) => {
                void navigate({ search: { slot }, to: '/connected/select-position' })
              }
        }
        onEditQuickPlay={
          isSearching
            ? undefined
            : (option, part, slot) => {
                // As in the client, spells and runes follow the champion
                if ((part === 'spells' || part === 'rune') && !localMember?.quickPlaySlots?.[option]?.championId) {
                  toast.add({
                    title: t(part === 'spells' ? 'lobby.quickPlay.championFirstSpells' : 'lobby.quickPlay.championFirstRunes'),
                    type: 'info',
                  })

                  return
                }

                void navigate({ search: { option, part, slot }, to: '/connected/quick-play' })
              }
        }
        queueStatus={isSearching ? <LobbyQueueTimer estimatedTime={estimatedTime} iconUrl={iconUrl} time={timer} /> : undefined}
        onInvite={() => {
          setLobbyInviteOverlayOpen(true)
        }}
      >
        {renderArchBottom()}
      </LobbyParty>

      <footer {...props(styles.footer)}>
        {/* Figma "Contador": IN QUEUE over QUIT. It rises over the arch's empty bottom instead of growing the footer, so
            Nothing above moves, and stays mounted to fade both ways */}
        <div inert={!isSearching} {...props(styles.inQueue, isSearching && styles.inQueueShown)}>
          <Button disabled style={styles.mainAction}>
            {t('queue.inQueue')}
          </Button>
        </div>

        <LobbyFooterMessages messages={footerMessages} />

        {isSearching ? (
          <Button style={styles.mainAction} variant="secondary" onClick={handleClose}>
            {t('queue.quit')}
          </Button>
        ) : (
          <div {...props(styles.actions)}>
            {/* As in the client, the X beside the main button leaves the lobby */}
            <IconButton aria-label={readCloseLabel()} size="large" onClick={handleClose}>
              <Icon name="close" size={32} />
            </IconButton>

            <Button
              disabled={
                quickPlayAction?.kind === 'ready'
                  ? quickPlayAction.disabled || setQuickPlayReady.isPending
                  : !viewModel.canJoinQueue || Boolean(quickPlayAction?.disabled)
              }
              style={styles.mainAction}
              onClick={handleMainAction}
            >
              {readMainActionLabel()}
            </Button>
          </div>
        )}
      </footer>

      <LeaveLobbyModal
        open={isLeaveModalOpen}
        onLeave={() => {
          void actions.deleteLobby()
        }}
        onOpenChange={setIsLeaveModalOpen}
      />

      <LobbyInviteSheet
        memberIds={
          new Set(
            viewModel.members.map(({ summonerId }) => {
              return summonerId
            }),
          )
        }
        open={isInviteSheetOpen}
        onInviteFriends={(summonerIds) => {
          return actions.invitePlayersById(summonerIds)
        }}
        onInviteRiotId={(riotId) => {
          return actions.invitePlayer(riotId)
        }}
        onOpenChange={setLobbyInviteOverlayOpen}
      />
    </div>
  )
}

const styles = create({
  actions: {
    display: 'flex',
    gap: 8,
  },
  // Figma "Bottom Action": over the arch's end, the button 24px in from the sides
  footer: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    paddingBlock: 16,
    paddingInline: 24,
    position: 'relative',
  },
  inQueue: {
    backgroundColor: color.background,
    bottom: 'calc(100% - 6px)',
    display: 'flex',
    insetInline: 0,
    opacity: 0,
    paddingBlockStart: 16,
    paddingInline: 24,
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translateY(8px)',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
  },
  inQueueShown: {
    opacity: 1,
    pointerEvents: 'auto',
    transform: 'none',
  },
  mainAction: {
    flexGrow: 1,
  },
  // The Figma sets it on the arch's panel; over a banner's ornament it brings a pill of that panel along, to stay readable
  partyType: {
    alignItems: 'center',
    backdropFilter: 'blur(6px)',
    backgroundColor: `color-mix(in srgb, ${color.panel} 85%, transparent)`,
    borderColor: color.border,
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    color: color.text,
    display: 'flex',
    gap: 8,
    marginBlock: 1,
    marginInline: 'auto',
    paddingBlock: 6,
    paddingInlineEnd: 14,
    paddingInlineStart: 6,
    textTransform: 'uppercase',
    width: 'fit-content',
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
})
