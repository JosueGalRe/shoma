import { readCurrentTurn } from '@/features/champ-select/champ-select-actions'

import type { ChampSelectMember, ChampSelectSession } from '@/features/champ-select/champ-select-actions'

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
  | 'picks-allies'
  | 'picks-enemies'
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
  'picks-allies': 'champSelect.allyTeamPicking',
  'picks-enemies': 'champSelect.enemyTeamPicking',
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
    if (myAction?.type === 'pick') {
      return 'pick'
    }

    // Whose turn it is, as the client's "Your team is picking..." and "Enemy team is picking..." say
    const pendingPicks = turn.filter((action) => {
      return action.type === 'pick' && !action.completed
    })

    if (pendingPicks.length === 0) {
      return 'declare'
    }

    return pendingPicks.some((action) => {
      return action.isAllyAction
    })
      ? 'picks-allies'
      : 'picks-enemies'
  }

  if (myAction?.type === 'ban') {
    return 'ban'
  }

  const isAllyBanPending = turn.some((action) => {
    return action.type === 'ban' && action.isAllyAction && !action.completed
  })

  return isAllyBanPending ? 'bans-allies' : 'bans-enemies'
}

// The cells whose ban or pick the timer runs for now; none while planning, which only declares intents
export function readActingCellIds(session: ChampSelectSession | null): Set<number> {
  if (!session || session.timer?.phase !== 'BAN_PICK') {
    return new Set()
  }

  const turn = readCurrentTurn(session.actions ?? []) ?? []

  return new Set(
    turn.flatMap((action) => {
      return action.completed ? [] : [action.actorCellId]
    }),
  )
}

export interface BanIntent {
  declarer: ChampSelectMember
  // Not the player's own declared pick
  isAlly: boolean
  // The queue forbids banning an ally's declared pick (disallowBanningTeammateHoveredChampions)
  isForbidden: boolean
}

// Who on the team declared the champion a ban would take, which the client asks about before banning it
export function readBanIntent(session: ChampSelectSession | null, championId: number): BanIntent | null {
  const declarer =
    championId > 0
      ? session?.myTeam?.find((member) => {
          return (member.championId || member.championPickIntent) === championId
        })
      : undefined

  if (!declarer) {
    return null
  }

  const isAlly = declarer.cellId !== session?.localPlayerCellId

  return { declarer, isAlly, isForbidden: isAlly && session?.disallowBanningTeammateHoveredChampions === true }
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
