import { useState } from 'react'

import { ToastProvider } from '@shoma/ui/toast'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useQueuePopFeedback } from '@/features/feedback/queue-pop-feedback'
import { GameflowTransitionOverlay } from '@/features/gameflow/components/gameflow-transition-overlay'
import { useGameflowNavigation } from '@/features/gameflow/hooks/use-gameflow-navigation'
import { ReceivedInvites } from '@/features/invites/components/received-invites'
import { ReadyCheckOverlay } from '@/features/ready-check/components/ready-check-overlay'
import { SocialScreen } from '@/features/social/components/social-screen'
import { useSocialDocked } from '@/features/social/hooks/use-social-docked'

import { useDdragonPrefetch } from './-hooks/use-dd-prefetch'

// Each screen draws its own TopBar and background; this layout keeps only what runs across all of them, and in a wide
// Window, Social's panel beside the screens
export function ConnectedRouteComponent() {
  const { t } = useTranslation()
  const docked = useSocialDocked()
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)

  useDdragonPrefetch()

  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    },
  })
  const { phase, isTransitioning, transitionTarget } = useGameflowNavigation()

  useQueuePopFeedback(phase)

  return (
    <ToastProvider closeLabel={t('common.close')} style={styles.toasts}>
      {transitionTarget !== null && transitionTarget !== pathname ? <Navigate replace to={transitionTarget} /> : null}

      <div {...props(styles.columns)}>
        <div {...props(styles.screen, docked && styles.dockedScreen)}>
          <Outlet />
        </div>

        {docked ? <div ref={setPanel} {...props(styles.panel)} /> : null}
      </div>

      <SocialScreen panel={docked ? panel : null} />

      <ReceivedInvites />

      <GameflowTransitionOverlay isOpen={isTransitioning} targetRoute={transitionTarget} />

      <ReadyCheckOverlay />
    </ToastProvider>
  )
}

const styles = create({
  columns: {
    display: 'flex',
    flexGrow: 1,
    minHeight: 0,
  },
  // The Figma's phone column, never under its 412px
  dockedScreen: {
    flexBasis: 480,
    maxWidth: 480,
    minWidth: 412,
  },
  // Social at the screens' right, as in the client; it gives up its width first. Contained, so the sheets Social opens
  // In it keep their fixed viewport to its box
  panel: {
    borderInlineStartColor: color.border,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: 1,
    contain: 'paint',
    flexBasis: 412,
    flexShrink: 1,
    minWidth: 320,
    position: 'relative',
  },
  // Native scroll, not ScrollArea: Radix's display:table viewport breaks the screens that fill the height and center.
  // It keeps the screens not rewritten yet scrollable, as the old layout did
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    minWidth: 0,
    overflowY: 'auto',
  },
  // Figma Swift Play lobby: the snackbar sits just over the screens' bottom action
  toasts: {
    bottom: 'calc(96px + env(safe-area-inset-bottom))',
  },
})
