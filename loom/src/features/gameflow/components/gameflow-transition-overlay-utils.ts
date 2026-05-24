import type { GameflowTransitionTargetRoute } from './gameflow-transition-overlay-types'

export function getGameflowTransitionLabel(targetRoute: GameflowTransitionTargetRoute | null): string {
  if (targetRoute === '/connected/lobby') {
    return 'Sincronizando lobby...'
  }

  if (targetRoute === '/connected/queue') {
    return 'Entrando a cola...'
  }

  if (targetRoute === '/connected/champ-select') {
    return 'Entrando a selección...'
  }

  return 'Actualizando...'
}
