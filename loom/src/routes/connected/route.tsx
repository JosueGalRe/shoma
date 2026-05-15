import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Power, UserRound } from 'lucide-react'

import { AppShell } from '@/components/layout'
import { BottomSheet, Button } from '@/components/ui'
import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { profileIconUrl } from '@/features/social/components/social-utils'
import { useQueuePopFeedback } from '@/features/feedback/queue-pop-feedback'
import { useGameflowNavigation } from '@/features/gameflow/hooks/use-gameflow-navigation'
import { useInvites } from '@/features/invites'
import { ReadyCheckOverlay } from '@/features/ready-check/components/ready-check-overlay'
import { GameflowTransitionOverlay } from '@/features/gameflow/components/gameflow-transition-overlay'
import { QueueOverlay } from '@/features/queue/components/queue-overlay'
import { SocialPanel } from '@/features/social/components/social-panel'

function useCurrentUserProfileIcon() {
  const transport = useSharedLCUTransport()
  const versionQuery = useLatestDdragonVersion()
  const currentSummonerQuery = useQuery(
    createLcuQueryOptions(currentSummonerDescriptor, transport),
  )

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

  const statusColor =
    status === 'connected'
      ? 'text-primary'
      : status === 'error'
        ? 'text-destructive'
        : 'text-accent'

  return (
    <AppShell className="flex flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden lg:flex-row h-full">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 bg-transparent p-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-gold/20 bg-surface-elevated/50 p-3 backdrop-blur-md shadow-[0_16px_40px_-12px_rgba(10,20,40,0.8)]">
              <div className="flex flex-col gap-1.5 pl-2">
                <h1 className="font-display text-lg tracking-widest text-primary font-bold uppercase">SHO'MA</h1>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(200,170,110,0.6)]"></div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${statusColor}`}>{statusLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-1">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={isSocialDrawerOpen}
                  aria-label="Toggle social panel"
                  onClick={toggleSocialDrawer}
                  className="flex items-center gap-2 rounded-full border border-border-gold/20 bg-surface/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary lg:hidden"
                >
                  {profileIcon ? (
                    <img src={profileIcon} alt="Profile" className="size-5 rounded-full border border-primary/30" />
                  ) : (
                    <UserRound className="size-4" aria-hidden="true" />
                  )}
                  <span>Social</span>
                </button>

                <button
                  type="button"
                  aria-label="Disconnect"
                  onClick={() => void disconnect()}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-gold/15 bg-surface/30 text-muted transition-all hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                >
                  <Power className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 min-w-0 overflow-y-auto">
            <Outlet />
          </div>
        </section>

        <aside className="hidden h-full w-80 flex-col overflow-hidden border-l border-border bg-secondary/50 p-4 lg:flex">
          <SocialPanel />
        </aside>
      </div>

      <ConnectedSocialBottomSheet />

      {invites.length > 0 ? (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm space-y-3 pointer-events-none">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="pointer-events-auto rounded-lg border border-primary bg-background p-4 text-foreground shadow-[0_0_20px_var(--shoma-primary)]"
            >
              <div className="mb-3 space-y-1">
                <p className="text-sm font-medium">{invite.inviterName}</p>
                <p className="text-sm text-muted">{invite.gameMode}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => void acceptInvite(invite.id)} size="sm" variant="primary">
                  Accept
                </Button>
                <Button className="flex-1" onClick={() => void declineInvite(invite.id)} size="sm" variant="secondary">
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <GameflowTransitionOverlay
        isOpen={isTransitioning}
        targetRoute={transitionTarget}
      />
      <QueueOverlay />
      <ReadyCheckOverlay />
    </AppShell>
  )
}

function ConnectedSocialBottomSheet() {
  const isSocialDrawerOpen = useUiStore(uiStoreSelectors.isSocialDrawerOpen)
  const setSocialDrawerOpen = useUiStore(uiStoreSelectors.setSocialDrawerOpen)

  return (
    <BottomSheet
      isOpen={isSocialDrawerOpen}
      onClose={() => setSocialDrawerOpen(false)}
      tall
      flush
    >
      <SocialPanel />
    </BottomSheet>
  )
}

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
