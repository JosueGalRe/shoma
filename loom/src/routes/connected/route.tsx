import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Power, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useQueuePopFeedback } from '@/features/feedback/queue-pop-feedback'
import { GameflowTransitionOverlay } from '@/features/gameflow/components/gameflow-transition-overlay'
import { useGameflowNavigation } from '@/features/gameflow/hooks/use-gameflow-navigation'
import { useInvites } from '@/features/invites'
import { ReadyCheckOverlay } from '@/features/ready-check/components/ready-check-overlay'
import { SocialPanel } from '@/features/social/components/social-panel'

import { ConnectedSocialBottomSheet } from './-components/connected-social-bottom-sheet'
import { useCurrentUserProfileIcon } from './-hooks/use-current-user-profile-icon'
import { connectedStyles } from './-styles'

function ConnectedRouteComponent() {
  const { t } = useTranslation()
  const isSocialDrawerOpen = useUiStore(uiStoreSelectors.isSocialDrawerOpen)
  const toggleSocialDrawer = useUiStore(uiStoreSelectors.toggleSocialDrawer)
  const { phase, isTransitioning, transitionTarget } = useGameflowNavigation(Route.fullPath)
  useQueuePopFeedback(phase)
  const status = useRelayStore(relayStoreSelectors.status)
  const disconnect = useRelayStore(relayStoreSelectors.disconnect)
  const { acceptInvite, declineInvite, invites } = useInvites()
  const profileIcon = useCurrentUserProfileIcon()
  let statusLabel = t('connection.status.idle')
  if (status === 'connected') {
    statusLabel = t('connection.status.connected')
  } else if (status === 'connecting') {
    statusLabel = t('connection.status.connecting')
  } else if (status === 'disconnected') {
    statusLabel = t('connection.status.disconnected')
  } else if (status === 'error') {
    statusLabel = t('connection.status.error')
  }

  let statusColor = 'text-accent'
  if (status === 'connected') {
    statusColor = 'text-primary'
  } else if (status === 'error') {
    statusColor = 'text-destructive'
  }

  return (
    <>
      <div className='flex h-full min-w-0 flex-1 flex-col overflow-x-hidden lg:flex-row'>
        <section className='flex min-w-0 flex-1 flex-col overflow-hidden'>
          <header className='shrink-0 bg-transparent px-3 pt-3'>
            <div className={connectedStyles.headerShell}>
              <div className='flex flex-col gap-1.5 pl-2'>
                <h1 className='font-display text-primary text-lg font-semibold tracking-widest uppercase'>SHO'MA</h1>
                <div className='flex items-center gap-2'>
                  <div className={connectedStyles.statusDot}></div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${statusColor}`}>{statusLabel}</span>
                </div>
              </div>

              <div className='flex items-center gap-2 pr-1'>
                <button
                  type='button'
                  aria-haspopup='dialog'
                  aria-expanded={isSocialDrawerOpen}
                  aria-label='Toggle social panel'
                  onClick={toggleSocialDrawer}
                  className={connectedStyles.socialPanelButton}
                >
                  {profileIcon ? (
                    <img src={profileIcon} alt='Profile' className={connectedStyles.socialPanelProfileIcon} />
                  ) : (
                    <UserRound className='size-4' aria-hidden='true' />
                  )}
                  <span>Social</span>
                </button>

                <button
                  type='button'
                  aria-label='Disconnect'
                  onClick={() => {
                    disconnect()
                  }}
                  className={connectedStyles.disconnectButton}
                >
                  <Power className='size-3.5' aria-hidden='true' />
                </button>
              </div>
            </div>
          </header>

          <div className='h-full min-w-0 overflow-y-auto'>
            <Outlet />
          </div>
        </section>

        <aside className={connectedStyles.socialPanelAside}>
          <SocialPanel />
        </aside>
      </div>

      <ConnectedSocialBottomSheet />

      {invites.length > 0 ? (
        <div className={connectedStyles.inviteStackContainer}>
          {invites.map((invite) => {
            return (
              <div key={invite.id} className={connectedStyles.inviteCard}>
                <div className='mb-3 space-y-1'>
                  <p className='text-sm font-medium'>{invite.inviterName}</p>
                  <p className='text-muted text-sm'>{invite.gameMode}</p>
                </div>

                <div className='flex gap-2'>
                  <Button
                    className='flex-1'
                    onClick={() => {
                      void acceptInvite(invite.id)
                    }}
                    size='sm'
                    variant='primary'
                  >
                    Accept
                  </Button>
                  <Button
                    className='flex-1'
                    onClick={() => {
                      void declineInvite(invite.id)
                    }}
                    size='sm'
                    variant='secondary'
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <GameflowTransitionOverlay isOpen={isTransitioning} targetRoute={transitionTarget} />
      <ReadyCheckOverlay />
    </>
  )
}

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
