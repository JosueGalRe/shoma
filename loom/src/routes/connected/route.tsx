import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Power, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BottomSheet, Button } from '@/components/ui'
import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useQueuePopFeedback } from '@/features/feedback/queue-pop-feedback'
import { GameflowTransitionOverlay } from '@/features/gameflow/components/gameflow-transition-overlay'
import { useGameflowNavigation } from '@/features/gameflow/hooks/use-gameflow-navigation'
import { useInvites } from '@/features/invites'
import { QueueOverlay } from '@/features/queue/components/queue-overlay'
import { ReadyCheckOverlay } from '@/features/ready-check/components/ready-check-overlay'
import { SocialPanel } from '@/features/social/components/social-panel'
import { profileIconUrl } from '@/features/social/components/social-utils'

function useCurrentUserProfileIcon() {
  const transport = useSharedLCUTransport()
  const versionQuery = useLatestDdragonVersion()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))

  const rawIconId = currentSummonerQuery.data?.profileIconId
  const iconId = typeof rawIconId === 'number' ? rawIconId : undefined

  return profileIconUrl(versionQuery.data, iconId)
}

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
  const statusLabel =
    status === 'connected'
      ? t('connection.status.connected')
      : status === 'connecting'
        ? t('connection.status.connecting')
        : status === 'disconnected'
          ? t('connection.status.disconnected')
          : status === 'error'
            ? t('connection.status.error')
            : t('connection.status.idle')

  const statusColor = status === 'connected' ? 'text-primary' : status === 'error' ? 'text-destructive' : 'text-accent'

  return (
    <>
      <div className='flex h-full min-w-0 flex-1 flex-col overflow-x-hidden lg:flex-row'>
        <section className='flex min-w-0 flex-1 flex-col overflow-hidden'>
          <header className='shrink-0 bg-transparent px-3 pt-3'>
            <div className='border-border-gold/20 bg-surface-elevated/50 flex items-center justify-between gap-3 rounded-2xl border p-3 shadow-[0_16px_40px_-12px_rgba(10,20,40,0.8)] backdrop-blur-md'>
              <div className='flex flex-col gap-1.5 pl-2'>
                <h1 className='font-display text-primary text-lg font-bold tracking-widest uppercase'>SHO'MA</h1>
                <div className='flex items-center gap-2'>
                  <div className='bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_6px_rgba(200,170,110,0.6)]'></div>
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
                  className='border-border-gold/20 bg-surface/40 text-primary hover:bg-primary/10 hover:border-primary/40 focus-visible:ring-primary flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all focus-visible:ring-1 focus-visible:outline-none lg:hidden'
                >
                  {profileIcon ? (
                    <img src={profileIcon} alt='Profile' className='border-primary/30 size-5 rounded-full border' />
                  ) : (
                    <UserRound className='size-4' aria-hidden='true' />
                  )}
                  <span>Social</span>
                </button>

                <button
                  type='button'
                  aria-label='Disconnect'
                  onClick={() => void disconnect()}
                  className='border-border-gold/15 bg-surface/30 text-muted hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive focus-visible:ring-destructive flex h-8 w-8 items-center justify-center rounded-full border transition-all focus-visible:ring-1 focus-visible:outline-none'
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

        <aside className='border-border bg-secondary/50 hidden h-full w-80 flex-col overflow-hidden border-l p-4 lg:flex'>
          <SocialPanel />
        </aside>
      </div>

      <ConnectedSocialBottomSheet />

      {invites.length > 0 ? (
        <div className='pointer-events-none fixed right-4 bottom-4 z-50 w-[calc(100vw-2rem)] max-w-sm space-y-3'>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className='border-primary bg-background text-foreground pointer-events-auto rounded-lg border p-4 shadow-[0_0_20px_var(--shoma-primary)]'
            >
              <div className='mb-3 space-y-1'>
                <p className='text-sm font-medium'>{invite.inviterName}</p>
                <p className='text-muted text-sm'>{invite.gameMode}</p>
              </div>

              <div className='flex gap-2'>
                <Button className='flex-1' onClick={() => void acceptInvite(invite.id)} size='sm' variant='primary'>
                  Accept
                </Button>
                <Button className='flex-1' onClick={() => void declineInvite(invite.id)} size='sm' variant='secondary'>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <GameflowTransitionOverlay isOpen={isTransitioning} targetRoute={transitionTarget} />
      <QueueOverlay />
      <ReadyCheckOverlay />
    </>
  )
}

function ConnectedSocialBottomSheet() {
  const isSocialDrawerOpen = useUiStore(uiStoreSelectors.isSocialDrawerOpen)
  const setSocialDrawerOpen = useUiStore(uiStoreSelectors.setSocialDrawerOpen)

  return (
    <BottomSheet isOpen={isSocialDrawerOpen} onClose={() => setSocialDrawerOpen(false)} tall flush>
      <SocialPanel />
    </BottomSheet>
  )
}

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
