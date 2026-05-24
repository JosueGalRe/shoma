export type GameflowTransitionTargetRoute = '/connected/lobby' | '/connected/queue' | '/connected/champ-select'

export type GameflowTransitionOverlayProps = {
  isOpen: boolean
  targetRoute: GameflowTransitionTargetRoute | null
}
