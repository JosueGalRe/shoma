import type { GameflowTransitionTargetRoute } from './gameflow-transition-overlay-types'

export function getGameflowTransitionLabel(
  targetRoute: GameflowTransitionTargetRoute | null,
  translate: (key: string) => string,
): string {
  if (targetRoute === '/connected/lobby') {
    return translate('gameflow.transition.lobby')
  }

  if (targetRoute === '/connected/queue') {
    return translate('gameflow.transition.queue')
  }

  if (targetRoute === '/connected/champ-select') {
    return translate('gameflow.transition.champSelect')
  }

  return translate('gameflow.transition.updating')
}
