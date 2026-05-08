import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRound } from 'lucide-react'

import { DebugToggle } from '@/components/debug-toggle'
import { AppShell } from '@/components/layout'
import { BottomSheet, Button } from '@/components/ui'
import { useRiftStore } from '@/core/state/rift-store'
import { useInvites } from '@/features/invites'
import { SocialPanel } from '@/features/social/components/SocialPanel'

function ConnectedRouteComponent() {
  const { t } = useTranslation()
  const [isSocialOpen, setIsSocialOpen] = useState(false)
  const status = useRiftStore((state) => state.status)
  const { acceptInvite, declineInvite, invites } = useInvites()
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

  const handleSocialToggle = () => {
    setIsSocialOpen((open) => !open)
  }

  const statusColor =
    status === 'connected'
      ? 'text-green-400'
      : status === 'error'
        ? 'text-red-400'
        : 'text-yellow-400'

  return (
    <AppShell className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden lg:flex-row">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-lol-border-subtle bg-lol-navy-900/90 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <h1 className="font-display text-xl tracking-wider text-lol-gold">MIMIC</h1>
                <div className="hidden min-w-0 items-center gap-2 sm:flex">
                  <span className="text-sm text-lol-text-secondary">{t('champSelect.phase')}:</span>
                  <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DebugToggle />
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={isSocialOpen}
                  aria-label="Toggle social panel"
                  onClick={handleSocialToggle}
                  className="inline-flex items-center gap-2 rounded-sm border border-lol-border-subtle px-3 py-1.5 text-sm font-medium text-lol-text-secondary transition-all duration-150 hover:border-lol-border-gold hover:text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold lg:hidden"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Social
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
              <span className="text-sm text-lol-text-secondary">{t('champSelect.phase')}:</span>
              <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
            </div>
          </header>

          <div className="flex-1 min-w-0 p-4">
            <Outlet />
          </div>
        </section>

        <aside className="hidden h-[100dvh] w-80 flex-col overflow-hidden border-l border-lol-border-subtle bg-lol-navy-900/50 p-4 lg:flex">
          <SocialPanel />
        </aside>
      </div>

      <BottomSheet
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
        tall
        flush
      >
        <SocialPanel />
      </BottomSheet>

      {invites.length > 0 ? (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm space-y-3 pointer-events-none">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="pointer-events-auto rounded-lg border border-lol-border-gold bg-lol-navy-950 p-4 text-lol-text-primary shadow-lol-glow-gold"
            >
              <div className="mb-3 space-y-1">
                <p className="text-sm font-medium">{invite.inviterName}</p>
                <p className="text-sm text-lol-text-secondary">{invite.gameMode}</p>
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
    </AppShell>
  )
}

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
