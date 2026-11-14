import { ToastProvider } from '@shoma/ui/toast'
import { create, props } from '@stylexjs/stylex'
import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useQueuePopFeedback } from '@/features/feedback/queue-pop-feedback'
import { GameflowTransitionOverlay } from '@/features/gameflow/components/gameflow-transition-overlay'
import { useGameflowNavigation } from '@/features/gameflow/hooks/use-gameflow-navigation'
import { ReceivedInvites } from '@/features/invites/components/received-invites'
import { ReadyCheckOverlay } from '@/features/ready-check/components/ready-check-overlay'

import { ConnectedSocialBottomSheet } from './-components/connected-social-bottom-sheet'
import { useDdragonPrefetch } from './-hooks/use-dd-prefetch'

// Each screen draws its own TopBar and background; this layout keeps only what runs across all of them
export function ConnectedRouteComponent() {
  const { t } = useTranslation()

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

      <div {...props(styles.screen)}>
        <Outlet />
      </div>

      <ConnectedSocialBottomSheet />

      <ReceivedInvites />

      <GameflowTransitionOverlay isOpen={isTransitioning} targetRoute={transitionTarget} />

      <ReadyCheckOverlay />
    </ToastProvider>
  )
}

const styles = create({
  // Native scroll, not ScrollArea: Radix's display:table viewport breaks the screens that fill the height and center.
  // It keeps the screens not rewritten yet scrollable, as the old layout did
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  // Figma Swift Play lobby: the snackbar sits just over the screens' bottom action
  toasts: {
    bottom: 'calc(96px + env(safe-area-inset-bottom))',
  },
})
