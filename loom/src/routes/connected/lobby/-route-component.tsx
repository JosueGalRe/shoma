import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { Switch } from '@shoma/ui/switch'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'
import { useLobby } from '@/features/lobby'
import { LeaveLobbyModal } from '@/features/lobby/components/leave-lobby-modal'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'
import { useQueue } from '@/features/queue'
import { PremadeReadyCheckOverlay } from '@/features/ready-check/components/premade-ready-check-overlay'

import { DashboardScreen } from './-components/dashboard-screen'
import { InGameScreen } from './-components/in-game-screen'
import { LobbyInviteOverlay } from './-components/lobby-invite-overlay'
import { LobbyParty } from './-components/lobby-party'
import { LobbyQueueTimer } from './-components/lobby-queue-timer'
import { LobbyTitle } from './-components/lobby-title'
import { useLobbyQueueArt } from './-hooks/use-lobby-queue-art'
import { useLobbyRegalia } from './-hooks/use-lobby-regalia'

// Figma lobby (Reclutamiento, Solo/Duo, Flex): the party over its map's art, and the search at the bottom
export function LobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { actionError, actions, isSettingPartyType, viewModel } = useLobby()
  const { cancelQueue, estimatedTime, gameflowPhase, isLowPriorityQueue, timer } = useQueue()
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const { backgroundUrl, description, iconUrl } = useLobbyQueueArt(viewModel.queueId)
  const regalia = useLobbyRegalia(viewModel.members)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  if (gameflowPhase === 'InProgress') {
    return <InGameScreen mode={viewModel.mode} />
  }

  if (!viewModel.hasLobby) {
    return <DashboardScreen />
  }

  const modeRules = getModeRules(viewModel.mode)
  const isSearching = viewModel.queueStatus.isSearching && gameflowPhase !== 'ReadyCheck'
  const translatedError = actionError ? translateLcuError(actionError) : null
  const isOpenParty = viewModel.partyType === 'open'

  function handleBack() {
    // As in the client, back is where the owner changes the mode; members can't, so for them it leaves the party
    if (viewModel.isOwner) {
      void navigate({ to: '/connected/create-lobby' })

      return
    }

    handleLeave()
  }

  function handleLeave() {
    if (viewModel.members.length > 1) {
      setIsLeaveModalOpen(true)

      return
    }

    void actions.deleteLobby()
  }

  function renderArchBottom() {
    if (isSearching) {
      return <LobbyQueueTimer estimatedTime={estimatedTime} time={timer} />
    }

    if (!viewModel.isOwner) {
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
        onInvite={() => {
          setLobbyInviteOverlayOpen(true)
        }}
      >
        {renderArchBottom()}
      </LobbyParty>

      <footer {...props(styles.footer)}>
        {actionError ? (
          <p role="alert" {...props(text.body4, styles.error)}>
            {t(translatedError?.messageKey ?? actionError, { defaultValue: actionError })}
          </p>
        ) : null}

        {isLowPriorityQueue ? <p {...props(text.body4, styles.error)}>{t('queue.lowPriority')}</p> : null}

        <div {...props(styles.actions)}>
          {/* As in the client, the X beside the main button leaves the lobby, or quits the queue while searching */}
          <IconButton
            aria-label={isSearching ? t('queue.quit') : t('lobby.leaveLobby')}
            size="large"
            onClick={() => {
              if (isSearching) {
                void cancelQueue()

                return
              }

              handleLeave()
            }}
          >
            <Icon name="close" size={32} />
          </IconButton>

          {isSearching ? (
            <Button disabled style={styles.mainAction}>
              {t('queue.inQueue')}
            </Button>
          ) : (
            <Button
              disabled={!viewModel.canJoinQueue}
              style={styles.mainAction}
              onClick={() => {
                void actions.joinQueue()
              }}
            >
              {t('queue.findMatch')}
            </Button>
          )}
        </div>
      </footer>

      <LeaveLobbyModal
        open={isLeaveModalOpen}
        onLeave={() => {
          void actions.deleteLobby()
        }}
        onOpenChange={setIsLeaveModalOpen}
      />

      <LobbyInviteOverlay />

      <PremadeReadyCheckOverlay isSwiftplay={viewModel.mode === 'swiftplay'} />
    </div>
  )
}

const styles = create({
  actions: {
    display: 'flex',
    gap: 8,
  },
  error: {
    color: color.danger,
    margin: 0,
    textAlign: 'center',
  },
  // Figma "Bottom Action": over the arch's end, the button 24px in from the sides
  footer: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 10,
    paddingBlock: 16,
    paddingInline: 24,
    position: 'relative',
  },
  mainAction: {
    flexGrow: 1,
  },
  partyType: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    paddingBlock: 8,
    textTransform: 'uppercase',
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
})
