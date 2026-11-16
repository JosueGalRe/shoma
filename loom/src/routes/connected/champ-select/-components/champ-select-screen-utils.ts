import { readCurrentTurn } from '@/features/champ-select/champ-select-actions'

import type { ChampSelectSession } from '@/features/champ-select/champ-select-actions'

// Where the local player is in champ select: it names the screen, colors the timer and picks the champion tab's content
export type ChampSelectStage =
  | 'ban'
  | 'bans-allies'
  | 'bans-enemies'
  | 'bans-revealed'
  | 'declare'
  | 'finalization'
  | 'locked'
  | 'pick'
  | 'planning'

export const STAGE_TITLES: Record<ChampSelectStage, string> = {
  ban: 'champSelect.banAChampion',
  'bans-allies': 'champSelect.waitingForPlayers',
  'bans-enemies': 'champSelect.waitingOnEnemyTeam',
  'bans-revealed': 'champSelect.bansLockedIn',
  declare: 'champSelect.pickYourChampion',
  finalization: 'champSelect.prepareForBattle',
  locked: 'champSelect.pickYourChampion',
  pick: 'champSelect.pickYourChampion',
  planning: 'champSelect.pickYourChampion',
}

export function readChampSelectStage(session: ChampSelectSession | null): ChampSelectStage {
  const timerPhase = session?.timer?.phase

  if (timerPhase === 'FINALIZATION' || timerPhase === 'GAME_STARTING') {
    return 'finalization'
  }

  if (!session || timerPhase === 'PLANNING') {
    return 'planning'
  }

  const actions = session.actions ?? []
  const local = session.localPlayerCellId
  const myPick = actions.flat().find((action) => {
    return action.actorCellId === local && action.type === 'pick'
  })

  if (myPick?.completed) {
    return 'locked'
  }

  // The client shows both teams' bans for a few seconds once the simultaneous bans end
  const isRevealing = actions.flat().some((action) => {
    return action.type === 'ten_bans_reveal' && action.isInProgress
  })

  if (isRevealing) {
    return 'bans-revealed'
  }

  const turn = readCurrentTurn(actions) ?? []
  const myAction = turn.find((action) => {
    return action.actorCellId === local && !action.completed
  })
  const isBanTurn = turn.some((action) => {
    return action.type === 'ban' && !action.completed
  })

  if (!isBanTurn) {
    return myAction?.type === 'pick' ? 'pick' : 'declare'
  }

  if (myAction?.type === 'ban') {
    return 'ban'
  }

  const isAllyBanPending = turn.some((action) => {
    return action.type === 'ban' && action.isAllyAction && !action.completed
  })

  return isAllyBanPending ? 'bans-allies' : 'bans-enemies'
}

export function isBanStage(stage: ChampSelectStage): boolean {
  return stage === 'ban' || stage === 'bans-allies' || stage === 'bans-enemies' || stage === 'bans-revealed'
}

// A tapped spell: a picked one leaves its key, another takes the first empty key, or F when both are taken
export function toggleSpell(pair: readonly [number, number], spellId: number): [number, number] {
  const [first, second] = pair

  if (spellId === first) {
    return [0, second]
  }

  if (spellId === second) {
    return [first, 0]
  }

  return first === 0 ? [spellId, second] : [first, spellId]
}
