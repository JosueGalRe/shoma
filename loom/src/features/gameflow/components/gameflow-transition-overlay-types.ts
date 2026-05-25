export type GameflowTransitionTargetRoute = '/connected/lobby' | '/connected/queue' | '/connected/champ-select'

export interface GameflowTransitionOverlayProps {
  isOpen: boolean
  targetRoute: GameflowTransitionTargetRoute | null
}
