import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { Modal } from '@shoma/ui/modal'
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

// Figma lobby (Reclutamiento, Solo/Duo, Flex): the party over its map's art, and the search at the bottom
export function LobbyRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { actionError, actions, isSettingPartyType, viewModel } = useLobby()
  const { cancelQueue, estimatedTime, gameflowPhase, isLowPriorityQueue, timer } = useQueue()
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const { backgroundUrl, description, iconUrl } = useLobbyQueueArt(viewModel.queueId)
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
    // Leaving a party can't be undone without a new invite; a lobby alone can
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

      <TopBar onBack={handleBack} />

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
        showRoles={modeRules.requiresRoleSelection}
        size={modeRules.maxPartySize}
        onEditRoles={
          isSearching
            ? undefined
            : () => {
                void navigate({ to: '/connected/select-position' })
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

        {isSearching ? (
          <>
            <Button disabled>{t('queue.inQueue')}</Button>

            <Button
              variant="secondary"
              onClick={() => {
                void cancelQueue()
              }}
            >
              {t('queue.quit')}
            </Button>
          </>
        ) : (
          <Button
            disabled={!viewModel.canJoinQueue}
            onClick={() => {
              void actions.joinQueue()
            }}
          >
            {t('queue.findMatch')}
          </Button>
        )}
      </footer>

      <Modal open={isLeaveModalOpen} title={t('lobby.leaveConfirm')} onOpenChange={setIsLeaveModalOpen}>
        <Button
          style={styles.fullWidth}
          onClick={() => {
            setIsLeaveModalOpen(false)
            void actions.deleteLobby()
          }}
        >
          {t('common.leave')}
        </Button>

        <Button
          style={styles.fullWidth}
          variant="secondary"
          onClick={() => {
            setIsLeaveModalOpen(false)
          }}
        >
          {t('common.cancel')}
        </Button>
      </Modal>

      <LobbyInviteOverlay />

      <PremadeReadyCheckOverlay isSwiftplay={viewModel.mode === 'swiftplay'} />
    </div>
  )
}

const styles = create({
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
  fullWidth: {
    width: '100%',
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
