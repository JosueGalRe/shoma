import type { SimChampSelect, SimChampSelectAction, SimChampSelectCell, SimPerson } from './sim-types'

// From a recorded Normal Draft: the real client's phases and turns
const PLANNING_MS = 12_000
const BAN_MS = 25_000
const REVEAL_MS = 6400
const PICK_MS = 25_000
const FINALIZATION_MS = 30_000
const GAME_STARTING_MS = 2000
const FAST_FORWARD_TICK_MS = 500

const REVEAL_ACTION_ID = 102
// [action id, cell] by pick turn; blue is cells 0-4, red 5-9
const PICK_TURNS = [
  [[10, 0]],
  [
    [11, 5],
    [12, 6],
  ],
  [
    [13, 1],
    [14, 2],
  ],
  [
    [15, 7],
    [16, 8],
  ],
  [
    [17, 3],
    [18, 4],
  ],
  [[19, 9]],
]
const POSITIONS = ['top', 'jungle', 'middle', 'bottom', 'utility']

const PICK_POOLS: Partial<Record<string, number[]>> = {
  bottom: [222, 51, 21, 81, 145, 498, 202, 236],
  jungle: [64, 254, 121, 104, 234, 59, 876, 106],
  middle: [103, 517, 7, 238, 134, 4, 245, 61],
  top: [86, 122, 516, 266, 24, 39, 58, 799],
  utility: [412, 89, 117, 111, 25, 497, 350, 147],
}
const BAN_POOL = [157, 777, 555, 875, 28, 950, 200, 11, 53, 35, 9, 893, 910, 901]
const SPELLS: Partial<Record<string, [number, number]>> = {
  bottom: [7, 4],
  jungle: [4, 11],
  middle: [14, 4],
  top: [12, 4],
  utility: [3, 4],
}

export interface SimSeat {
  championId: number
  // The lobby's preference (TOP, FILL, UNSELECTED…) or Swift Play's slot position
  position: string
  skinId: number
  spell1Id: number
  spell2Id: number
  summonerId: number
}

export interface CreateChampSelectOptions {
  now: number
  queueId: number
  random: () => number
  // The local player first, then the rest of the team
  seats: SimSeat[]
  skipped: boolean
}

export interface SimChampSelectStep {
  champSelect: SimChampSelect
  // The game begins (start), or the local player's pick ran out with nothing hovered (dodge)
  outcome: 'dodge' | 'start' | null
}

// Where a panel scenario leaves the local player
export type SimChampSelectTarget = 'ban' | 'pick' | 'finalization'

export interface LocalActionPatch {
  actionId: number
  championId: number | null
  completed: boolean
  now: number
  random: () => number
}

function between(random: () => number, min: number, max: number): number {
  return Math.round(min + random() * (max - min))
}

function shuffle<T>(values: T[], random: () => number): T[] {
  return values
    .map((value) => {
      return { key: random(), value }
    })
    .toSorted((a, b) => {
      return a.key - b.key
    })
    .map(({ value }) => {
      return value
    })
}

function assignPositions(seats: SimSeat[], random: () => number): string[] {
  const free = [...POSITIONS]
  const wanted = seats.map((seat) => {
    const position = seat.position.toLowerCase()
    const index = free.indexOf(position)

    return index === -1 ? null : (free.splice(index, 1)[0] ?? null)
  })

  return wanted.map((position) => {
    return position ?? free.splice(Math.floor(random() * free.length), 1)[0] ?? 'middle'
  })
}

function findCell(champSelect: SimChampSelect, cellId: number): SimChampSelectCell | undefined {
  return champSelect.cells.find((cell) => {
    return cell.cellId === cellId
  })
}

function isLocked(champSelect: SimChampSelect, championId: number): boolean {
  return (
    championId > 0 &&
    champSelect.actions.flat().some((action) => {
      return action.completed && action.type !== 'ten_bans_reveal' && action.championId === championId
    })
  )
}

// What a bot can't take: locked bans and picks, and what others hover or plan to pick
function readTaken(champSelect: SimChampSelect, except: SimChampSelectAction): Set<number> {
  const taken = new Set<number>()

  for (const action of champSelect.actions.flat()) {
    if (action !== except && action.championId > 0 && (action.completed || action.type === 'pick')) {
      taken.add(action.championId)
    }
  }

  return taken
}

function chooseChampion(champSelect: SimChampSelect, action: SimChampSelectAction, random: () => number): number {
  const taken = readTaken(champSelect, action)
  const position = findCell(champSelect, action.actorCellId)?.position ?? ''
  const pool = action.type === 'ban' ? BAN_POOL : (PICK_POOLS[position] ?? [])
  const free = pool.filter((championId) => {
    return !taken.has(championId)
  })
  const fallback = Object.values(PICK_POOLS)
    .flat()
    .filter((championId) => {
      return championId !== undefined && !taken.has(championId)
    })
  const choices = free.length > 0 ? free : fallback

  return choices[Math.floor(random() * choices.length)] ?? 0
}

function hover(champSelect: SimChampSelect, action: SimChampSelectAction, championId: number): void {
  const cell = findCell(champSelect, action.actorCellId)

  action.championId = championId

  if (cell && action.type === 'pick') {
    cell.intent = championId
  }
}

function lock(champSelect: SimChampSelect, action: SimChampSelectAction, championId: number): void {
  const cell = findCell(champSelect, action.actorCellId)

  action.championId = championId
  action.completed = true

  if (cell && action.type === 'pick') {
    cell.championId = championId
    cell.intent = 0
    cell.skinId = championId * 1000
  }
}

function setTimer(champSelect: SimChampSelect, now: number, durationMs: number): void {
  champSelect.deadline = now + durationMs
  champSelect.timerTotal = durationMs
}

function scheduleBots(champSelect: SimChampSelect, now: number, random: () => number): void {
  for (const action of champSelect.actions[champSelect.turn] ?? []) {
    if (!action.completed && action.actorCellId !== champSelect.localCellId) {
      const lockAt = now + (action.type === 'ban' ? between(random, 2000, 20_000) : between(random, 4000, 22_000))

      action.bot = { hoverAt: Math.max(now + 300, lockAt - between(random, 500, 4000)), lockAt }
    }
  }
}

function finishTurnIfDone(champSelect: SimChampSelect, now: number, random: () => number): void {
  const isDone = (champSelect.actions[champSelect.turn] ?? []).every((action) => {
    return action.completed
  })

  if (!isDone) {
    return
  }

  champSelect.turn += 1

  const [next] = champSelect.actions[champSelect.turn] ?? []

  if (!next) {
    champSelect.phase = 'FINALIZATION'
    setTimer(champSelect, now, FINALIZATION_MS)
  } else if (next.type === 'ten_bans_reveal') {
    // One timer covers the reveal and the first pick
    setTimer(champSelect, now, REVEAL_MS + PICK_MS)
  } else {
    setTimer(champSelect, now, PICK_MS)
    scheduleBots(champSelect, now, random)
  }
}

// Bumps the counter and stamps the timer when something changed, as each LCU session update does
function commit(current: SimChampSelect, next: SimChampSelect, timerAt: number): SimChampSelect {
  if (JSON.stringify(current) === JSON.stringify(next)) {
    return current
  }

  return { ...next, counter: next.counter + 1, timerAt }
}

function readNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

function createAction(id: number, actorCellId: number, type: SimChampSelectAction['type']): SimChampSelectAction {
  return { actorCellId, bot: null, championId: 0, completed: false, id, type }
}

function draftActions(): SimChampSelectAction[][] {
  const bans = Array.from({ length: 10 }, (_value, cellId) => {
    return createAction(cellId, cellId, 'ban')
  })
  const picks = PICK_TURNS.map((turn) => {
    return turn.map(([id = 0, cellId = 0]) => {
      return createAction(id, cellId, 'pick')
    })
  })

  return [bans, [createAction(REVEAL_ACTION_ID, -1, 'ten_bans_reveal')], ...picks]
}

export function createChampSelect({ now, queueId, random, seats, skipped }: CreateChampSelectOptions): SimChampSelect {
  const team = random() < 0.5 ? 1 : 2
  const firstCell = team === 1 ? 0 : 5
  const offsets = shuffle([0, 1, 2, 3, 4], random)
  const positions = assignPositions(seats, random)
  const myTeam = seats.slice(0, 5).map((seat, index): SimChampSelectCell => {
    const position = positions[index] ?? 'middle'
    const [spell1Id, spell2Id] = seat.spell1Id > 0 ? [seat.spell1Id, seat.spell2Id] : (SPELLS[position] ?? [4, 14])
    const pool = PICK_POOLS[position] ?? []
    const championId = skipped ? seat.championId || (pool[Math.floor(random() * pool.length)] ?? 1) : 0

    return {
      cellId: firstCell + (offsets[index] ?? index),
      championId,
      intent: 0,
      position,
      skinId: skipped ? seat.skinId || championId * 1000 : 0,
      spell1Id,
      spell2Id,
      summonerId: seat.summonerId,
      team,
      wardSkinId: -1,
    }
  })
  const theirTeam = shuffle(POSITIONS, random).map((position, index): SimChampSelectCell => {
    return {
      cellId: (team === 1 ? 5 : 0) + index,
      championId: 0,
      intent: 0,
      position,
      skinId: 0,
      spell1Id: 0,
      spell2Id: 0,
      summonerId: 0,
      team: 3 - team,
      wardSkinId: -1,
    }
  })
  const champSelect: SimChampSelect = {
    actions: skipped ? [] : draftActions(),
    cells: [...myTeam, ...theirTeam].toSorted((a, b) => {
      return a.cellId - b.cellId
    }),
    counter: 1,
    deadline: now + (skipped ? GAME_STARTING_MS : PLANNING_MS),
    gameId: between(random, 1_000_000_000, 2_000_000_000),
    id: crypto.randomUUID(),
    localCellId: myTeam[0]?.cellId ?? firstCell,
    phase: skipped ? 'GAME_STARTING' : 'PLANNING',
    queueId,
    skipped,
    timerAt: now,
    timerTotal: skipped ? 0 : PLANNING_MS,
    turn: 0,
  }

  // About half the bots on the local team declare their pick in planning
  for (const action of champSelect.actions.flat()) {
    const cell = findCell(champSelect, action.actorCellId)

    if (action.type === 'pick' && cell?.team === team && cell.cellId !== champSelect.localCellId && random() < 0.5) {
      hover(champSelect, action, chooseChampion(champSelect, action, random))
    }
  }

  return champSelect
}

export function advanceChampSelect(current: SimChampSelect, now: number, random: () => number): SimChampSelectStep {
  if (current.phase === 'GAME_STARTING') {
    return { champSelect: current, outcome: now >= current.deadline ? 'start' : null }
  }

  const next = structuredClone(current)

  if (next.phase !== 'BAN_PICK') {
    if (now < next.deadline) {
      return { champSelect: current, outcome: null }
    }

    if (next.phase === 'PLANNING') {
      next.phase = 'BAN_PICK'
      setTimer(next, now, BAN_MS)
      scheduleBots(next, now, random)
    } else {
      next.phase = 'GAME_STARTING'
      next.deadline = now + GAME_STARTING_MS
      next.timerTotal = 0
    }

    return { champSelect: commit(current, next, now), outcome: null }
  }

  const group = next.actions[next.turn] ?? []
  const [reveal] = group

  if (reveal?.type === 'ten_bans_reveal') {
    if (now < next.deadline - PICK_MS) {
      return { champSelect: current, outcome: null }
    }

    reveal.completed = true
    next.turn += 1
    scheduleBots(next, now, random)

    // The LCU sends this update with the reveal's timer, not one refreshed for the pick
    return { champSelect: commit(current, next, next.timerAt), outcome: null }
  }

  for (const action of group) {
    if (!action.completed && action.bot && now >= action.bot.lockAt) {
      const championId = action.championId > 0 && !isLocked(next, action.championId) ? action.championId : 0

      lock(next, action, championId || chooseChampion(next, action, random))
    } else if (!action.completed && action.bot && now >= action.bot.hoverAt && action.championId === 0) {
      hover(next, action, chooseChampion(next, action, random))
    }
  }

  if (now >= next.deadline) {
    for (const action of group) {
      // The client locks what's hovered; a pick with nothing hovered dodges
      if (!action.completed && action.type === 'pick' && action.championId === 0) {
        return { champSelect: current, outcome: 'dodge' }
      }

      if (!action.completed) {
        lock(next, action, action.championId)
      }
    }
  }

  finishTurnIfDone(next, now, random)

  return { champSelect: commit(current, next, now), outcome: null }
}

// The local player's hover, planned pick or lock; null when the LCU would refuse it
export function patchLocalAction(current: SimChampSelect, patch: LocalActionPatch): SimChampSelect | null {
  const next = structuredClone(current)
  const turn = next.actions.findIndex((group) => {
    return group.some((candidate) => {
      return candidate.id === patch.actionId
    })
  })
  const action = next.actions[turn]?.find((candidate) => {
    return candidate.id === patch.actionId
  })
  const isInProgress = next.phase === 'BAN_PICK' && turn === next.turn
  const championId = patch.championId ?? action?.championId ?? 0

  if (!action || action.actorCellId !== next.localCellId || action.completed || isLocked(next, championId)) {
    return null
  }

  // Before its turn a pick only declares the intent
  const canPlan = action.type === 'pick' && !patch.completed && (next.phase === 'PLANNING' || next.phase === 'BAN_PICK')

  if (!isInProgress && !canPlan) {
    return null
  }

  if (patch.completed && action.type === 'pick' && championId === 0) {
    return null
  }

  if (patch.completed) {
    lock(next, action, championId)
    finishTurnIfDone(next, patch.now, patch.random)
  } else {
    hover(next, action, championId)
  }

  return commit(current, next, patch.now)
}

export function patchLocalSelection(current: SimChampSelect, patch: Record<string, unknown>, now: number): SimChampSelect {
  const next = structuredClone(current)
  const cell = findCell(next, next.localCellId)

  if (cell) {
    cell.skinId = readNumberOr(patch.selectedSkinId, cell.skinId)
    cell.spell1Id = readNumberOr(patch.spell1Id, cell.spell1Id)
    cell.spell2Id = readNumberOr(patch.spell2Id, cell.spell2Id)
    cell.wardSkinId = readNumberOr(patch.wardSkinId, cell.wardSkinId)
  }

  return commit(current, next, now)
}

function readLocalTurnAction(champSelect: SimChampSelect): SimChampSelectAction | undefined {
  if (champSelect.phase !== 'BAN_PICK') {
    return undefined
  }

  return champSelect.actions[champSelect.turn]?.find((action) => {
    return action.actorCellId === champSelect.localCellId && !action.completed
  })
}

function isAtTarget(champSelect: SimChampSelect, target: SimChampSelectTarget): boolean {
  if (target === 'ban') {
    return champSelect.phase === 'BAN_PICK' && champSelect.turn === 0
  }

  return target === 'pick' ? readLocalTurnAction(champSelect)?.type === 'pick' : champSelect.phase === 'FINALIZATION'
}

export interface FastForwardOptions {
  now: number
  random: () => number
  target: SimChampSelectTarget
}

// Plays champ select on a fast clock up to the target, taking the local player's turns on the way.
// Times end up relative to now
export function fastForwardChampSelect(current: SimChampSelect, { now, random, target }: FastForwardOptions): SimChampSelect {
  let champSelect = current
  let clock = now

  while (!isAtTarget(champSelect, target) && clock - now < 600_000) {
    const action = readLocalTurnAction(champSelect)

    if (action) {
      const championId = action.championId || chooseChampion(champSelect, action, random)

      champSelect =
        patchLocalAction(champSelect, { actionId: action.id, championId, completed: true, now: clock, random }) ?? champSelect
    }

    clock += FAST_FORWARD_TICK_MS

    const { champSelect: next } = advanceChampSelect(champSelect, clock, random)

    champSelect = next
  }

  const shift = now - clock

  return {
    ...champSelect,
    actions: champSelect.actions.map((group) => {
      return group.map((action) => {
        return action.bot
          ? { ...action, bot: { hoverAt: action.bot.hoverAt + shift, lockAt: action.bot.lockAt + shift } }
          : action
      })
    }),
    counter: champSelect.counter + 1,
    deadline: champSelect.deadline + shift,
    timerAt: now,
  }
}

function memberDto(cell: SimChampSelectCell, isAlly: boolean, person: SimPerson | null): Record<string, unknown> {
  return {
    assignedPosition: isAlly ? cell.position : '',
    cellId: cell.cellId,
    championId: cell.championId,
    championPickIntent: cell.intent,
    gameName: person?.gameName ?? '',
    internalName: '',
    isAutofilled: false,
    isHumanoid: false,
    nameVisibilityType: isAlly ? 'VISIBLE' : 'HIDDEN',
    obfuscatedPuuid: '',
    obfuscatedSummonerId: 0,
    pickMode: 0,
    pickTurn: 0,
    playerAlias: '',
    playerType: '',
    puuid: person?.puuid ?? '',
    selectedSkinId: isAlly ? cell.skinId : 0,
    spell1Id: cell.spell1Id,
    spell2Id: cell.spell2Id,
    summonerId: cell.summonerId,
    tagLine: person?.tagLine ?? '',
    team: cell.team,
    wardSkinId: cell.wardSkinId,
  }
}

// /lol-champ-select/v1/session as the local player sees it
export function champSelectSessionDto(
  champSelect: SimChampSelect,
  findPerson: (summonerId: number) => SimPerson | null,
): Record<string, unknown> {
  const team = findCell(champSelect, champSelect.localCellId)?.team ?? 1
  const turn = champSelect.phase === 'PLANNING' || champSelect.phase === 'BAN_PICK' ? champSelect.turn : -1
  const actions = champSelect.actions.map((group, index) => {
    return group.map((action) => {
      const isAllyAction = findCell(champSelect, action.actorCellId)?.team === team
      // The other team's bans show once the reveal starts
      const isHidden = turn === 0 && action.type === 'ban' && !isAllyAction

      return {
        actorCellId: action.actorCellId,
        championId: isHidden ? 0 : action.championId,
        completed: !isHidden && action.completed,
        duration: 0,
        id: action.id,
        isAllyAction,
        isInProgress: index === turn && (isHidden || !action.completed),
        pickTurn: 0,
        type: action.type,
      }
    })
  })
  const members = (isAlly: boolean): Record<string, unknown>[] => {
    return champSelect.cells
      .filter((cell) => {
        return (cell.team === team) === isAlly
      })
      .map((cell) => {
        return memberDto(cell, isAlly, findPerson(cell.summonerId))
      })
  }

  return {
    actions,
    allowBattleBoost: false,
    allowDuplicatePicks: false,
    allowLockedEvents: false,
    allowPlayerPickSameChampion: false,
    allowRerolling: false,
    allowSkinSelection: !champSelect.skipped,
    allowSubsetChampionPicks: false,
    bans: { myTeamBans: [], numBans: 0, theirTeamBans: [] },
    benchChampions: [],
    benchEnabled: false,
    boostableSkinCount: 0,
    chatDetails: {
      mucJwtDto: { channelClaim: champSelect.id, domain: 'lol-champ-select', jwt: '', targetRegion: '' },
      multiUserChatId: '',
      multiUserChatPassword: '',
    },
    counter: champSelect.counter,
    disallowBanningTeammateHoveredChampions: true,
    gameId: champSelect.gameId,
    hasSimultaneousBans: true,
    hasSimultaneousPicks: champSelect.skipped,
    id: champSelect.id,
    isCustomGame: false,
    isLegacyChampSelect: false,
    isSpectating: false,
    localPlayerCellId: champSelect.localCellId,
    lockedEventIndex: -1,
    myTeam: members(true),
    pickOrderSwaps: [],
    positionSwaps: [],
    queueId: champSelect.queueId,
    rerollsRemaining: 0,
    showQuitButton: false,
    skipChampionSelect: champSelect.skipped,
    theirTeam: members(false),
    timer: {
      adjustedTimeLeftInPhase:
        champSelect.phase === 'GAME_STARTING' ? 0 : Math.max(0, champSelect.deadline - champSelect.timerAt),
      internalNowInEpochMs: champSelect.timerAt,
      isInfinite: false,
      phase: champSelect.phase,
      totalTimeInPhase: champSelect.timerTotal,
    },
    trades: [],
  }
}
