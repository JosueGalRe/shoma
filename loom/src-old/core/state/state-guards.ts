import type { GameflowPhase } from './gameflow-store'

export type GuardedGameflowAction = 'startQueue' | 'acceptReadyCheck' | 'pickChampion' | 'cancelQueue'

type GuardFailureMessages = Record<GuardedGameflowAction, (phase: GameflowPhase) => string>

const guardFailureMessages: GuardFailureMessages = {
  acceptReadyCheck: (phase) => `Cannot accept ready check while gameflow phase is "${phase}". Ready checks can only be accepted during readyCheck.`,
  cancelQueue: (phase) => `Cannot cancel queue while gameflow phase is "${phase}". Queue can only be cancelled during queue.`,
  pickChampion: (phase) => `Cannot pick champion while gameflow phase is "${phase}". Champions can only be picked during champSelect.`,
  startQueue: (phase) => `Cannot start queue while gameflow phase is "${phase}". Queue can only be started from lobby.`,
}

export function canStartQueue(phase: GameflowPhase): boolean {
  return phase === 'lobby'
}

export function canAcceptReadyCheck(phase: GameflowPhase): boolean {
  return phase === 'readyCheck'
}

export function canPickChampion(phase: GameflowPhase): boolean {
  return phase === 'champSelect'
}

export function canCancelQueue(phase: GameflowPhase): boolean {
  return phase === 'queue'
}

export function getActionGuardError(action: GuardedGameflowAction, phase: GameflowPhase): Error | null {
  if (isActionAllowed(action, phase)) {
    return null
  }

  return new Error(guardFailureMessages[action](phase))
}

export function assertActionAllowed(action: GuardedGameflowAction, phase: GameflowPhase): void {
  const error = getActionGuardError(action, phase)
  if (error) {
    throw error
  }
}

export function isActionAllowed(action: GuardedGameflowAction, phase: GameflowPhase): boolean {
  switch (action) {
    case 'acceptReadyCheck':
      return canAcceptReadyCheck(phase)
    case 'cancelQueue':
      return canCancelQueue(phase)
    case 'pickChampion':
      return canPickChampion(phase)
    case 'startQueue':
      return canStartQueue(phase)
  }
}
