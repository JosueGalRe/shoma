import { create, props } from '@stylexjs/stylex'
import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'

import { useQueuePopFeedback } from '@/features/feedback/queue-pop-feedback'
import { GameflowTransitionOverlay } from '@/features/gameflow/components/gameflow-transition-overlay'
import { useGameflowNavigation } from '@/features/gameflow/hooks/use-gameflow-navigation'
import { ReceivedInvites } from '@/features/invites/components/received-invites'
import { ReadyCheckOverlay } from '@/features/ready-check/components/ready-check-overlay'

import { ConnectedSocialBottomSheet } from './-components/connected-social-bottom-sheet'
import { useDdragonPrefetch } from './-hooks/use-dd-prefetch'

// Each screen draws its own TopBar and background; this layout keeps only what runs across all of them
export function ConnectedRouteComponent() {
  useDdragonPrefetch()

  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    },
  })
  const { phase, isTransitioning, transitionTarget } = useGameflowNavigation()

  useQueuePopFeedback(phase)

  return (
    <>
      {transitionTarget !== null && transitionTarget !== pathname ? <Navigate replace to={transitionTarget} /> : null}

      <div {...props(styles.screen)}>
        <Outlet />
      </div>

      <ConnectedSocialBottomSheet />

      <ReceivedInvites />

      <GameflowTransitionOverlay isOpen={isTransitioning} targetRoute={transitionTarget} />

      <ReadyCheckOverlay />
    </>
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
})
