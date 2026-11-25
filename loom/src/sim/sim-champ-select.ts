import type { SimChampSelect, SimChampSelectAction, SimChampSelectCell, SimChampSwapEnd, SimPerson } from './sim-types'

// From a recorded Normal Draft: the real client's phases and turns
const PLANNING_MS = 12_000
const BAN_MS = 25_000
const REVEAL_MS = 6400
const PICK_MS = 25_000
const FINALIZATION_MS = 30_000
const GAME_STARTING_MS = 2000
const FAST_FORWARD_TICK_MS = 500
// From recorded ARAM: Mayhem games: picking a card takes BAN_PICK, which runs its 15 s even once everyone picked
const CARDS_MS = 15_000
// From a recorded Arena de Valentía (1740): everyone picks at once in a BAN_PICK of 40 s, with no bans. The others lock
// Between 5 and 36 s in
const ARENA_PICK_MS = 40_000
const ARENA_BOT_LOCK_MS: [number, number] = [5000, 36_000]
// The client's blessing: a third card, in about half the recorded hands
const THIRD_CARD_CHANCE = 0.5
// Most bots swap with the bench in finalization, some more than once
const BENCH_SWAP_CHANCE = 0.5
const BENCH_SWAP_AGAIN_CHANCE = 0.4
// The client's own timers, from rcp-fe-lol-champ-select's SWAP_SERVICE_CALL_TIMEOUTS.
// The requester cancels an unanswered champion swap at 15 s, and clears an ended one, an accepted one almost at once
const SWAP_CANCEL_MS = 15_000
const SWAP_CLEAR_MS = 1700
const SWAP_ACCEPTED_CLEAR_MS = 200
// The recorded teammate never answered; some bots do
const SWAP_ACCEPT_CHANCE = 0.3
const SWAP_DECLINE_CHANCE = 0.2
const TRADE_ID_OFFSET = 100

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

// The pick pools as /lol-perks/v1/recommended-champion-positions names their lanes
export const SIM_PICK_LANES = Object.entries(PICK_POOLS).flatMap(([position, pool]) => {
  return (pool ?? []).map((championId): [championId: number, lane: string] => {
    return [championId, position.toUpperCase()]
  })
})

const BAN_POOL = [157, 777, 555, 875, 28, 950, 200, 11, 53, 35, 9, 893, 910, 901]
const CARD_POOL = [
  ...BAN_POOL,
  ...Object.values(PICK_POOLS).flatMap((pool) => {
    return pool ?? []
  }),
]
const SPELLS: Partial<Record<string, [number, number]>> = {
  bottom: [7, 4],
  jungle: [4, 11],
  middle: [14, 4],
  top: [12, 4],
  utility: [3, 4],
}
// Mark and Flash
const ARAM_SPELLS: [number, number] = [32, 4]
// Arena's own, as the recording's cells carry them
const ARENA_SPELLS: [number, number] = [2201, 2202]

// The client's BRAVERY_CHAMP: Arena's random champion, offered beside the pickable ones
export const BRAVERY_CHAMPION_ID = -3

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
  // ARAM: each player picks one of the cards dealt to them, and the rest go to the team's bench
  hasCards: boolean
  now: number
  queueId: number
  random: () => number
  // The local player first, then the rest of the team
  seats: SimSeat[]
  skipped: boolean
}

export interface CreateArenaChampSelectOptions {
  now: number
  // Champions dealt to each player, as Arena de Valentía deals 5 (pickable-champion-ids); 0 for the whole roster
  optionCount: number
  queueId: number
  random: () => number
  // The local player first, then the rest of their team
  seats: SimSeat[]
  // The queue's players, and how many make a team
  size: number
  subteamSize: number
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
  const cards = findCell(champSelect, action.actorCellId)?.cards ?? []

  if (cards.length > 0) {
    return cards[Math.floor(random() * cards.length)] ?? 0
  }

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
    // Arena's Valentía (-3) is no champion yet, so it has no skin
    cell.skinId = championId > 0 ? championId * 1000 : 0
  }
}

function setTimer(champSelect: SimChampSelect, now: number, durationMs: number): void {
  champSelect.deadline = now + durationMs
  champSelect.timerTotal = durationMs
}

function isLocalTeam(champSelect: SimChampSelect, cell: SimChampSelectCell): boolean {
  return cell.team === findCell(champSelect, champSelect.localCellId)?.team
}

// Arena puts every player on the local team, but the local player only sees their own subteam
function isShownTeammate(champSelect: SimChampSelect, cell: SimChampSelectCell): boolean {
  const { localCellId, subteamSize } = champSelect

  return subteamSize
    ? Math.floor(cell.cellId / subteamSize) === Math.floor(localCellId / subteamSize)
    : isLocalTeam(champSelect, cell)
}

// ARAM: the cards not picked go to the bench of the player's team, which only that team sees
function pickCard(champSelect: SimChampSelect, action: SimChampSelectAction, championId: number): void {
  const cell = findCell(champSelect, action.actorCellId)

  lock(champSelect, action, championId)

  if (cell && isLocalTeam(champSelect, cell)) {
    champSelect.bench.push(
      ...cell.cards.filter((card) => {
        return card !== championId
      }),
    )
  }
}

// A locked champion changing hands: the cell, its base skin and its pick
function setChampion(champSelect: SimChampSelect, cell: SimChampSelectCell, championId: number): void {
  const action = champSelect.actions.flat().find((candidate) => {
    return candidate.actorCellId === cell.cellId && candidate.type === 'pick'
  })

  cell.championId = championId
  cell.skinId = championId * 1000

  if (action) {
    action.championId = championId
  }
}

// ARAM: the champion takes the bench slot of the one it swaps for
function swapWithBench(champSelect: SimChampSelect, cell: SimChampSelectCell, index: number): void {
  const championId = champSelect.bench[index] ?? 0

  champSelect.bench[index] = cell.championId
  setChampion(champSelect, cell, championId)
}

function tradeId(cellId: number): number {
  return TRADE_ID_OFFSET + cellId
}

// The local player's allies, the other side of every champion swap
function readTradeCells(champSelect: SimChampSelect): SimChampSelectCell[] {
  return champSelect.cells.filter((cell) => {
    return cell.cellId !== champSelect.localCellId && isLocalTeam(champSelect, cell)
  })
}

// As the recordings show it: open once both have a champion, and closed to the rest while a swap waits. Arena has none
function readTradeState(champSelect: SimChampSelect, cell: SimChampSelectCell): string {
  if (champSelect.subteamSize) {
    return 'INVALID'
  }

  const swap = champSelect.championSwap
  const isWaiting = swap?.state === 'SENT' || swap?.state === 'RECEIVED'
  const hasChampions = cell.championId > 0 && (findCell(champSelect, champSelect.localCellId)?.championId ?? 0) > 0

  if (isWaiting && swap.cellId === cell.cellId) {
    return swap.state
  }

  return hasChampions && !isWaiting ? 'AVAILABLE' : 'INVALID'
}

function findTradeCell(champSelect: SimChampSelect, id: number): SimChampSelectCell | undefined {
  const isOpen = champSelect.phase === 'BAN_PICK' || champSelect.phase === 'FINALIZATION'

  return isOpen
    ? readTradeCells(champSelect).find((cell) => {
        return tradeId(cell.cellId) === id
      })
    : undefined
}

function endSwap(champSelect: SimChampSelect, end: SimChampSwapEnd, now: number): void {
  const swap = champSelect.championSwap

  if (!swap) {
    return
  }

  const local = findCell(champSelect, champSelect.localCellId)
  const other = findCell(champSelect, swap.cellId)

  if (end === 'ACCEPTED' && local && other) {
    const localChampionId = local.championId

    setChampion(champSelect, local, other.championId)
    setChampion(champSelect, other, localChampionId)
  }

  champSelect.championSwap = {
    ...swap,
    dueAt: now + (end === 'ACCEPTED' ? SWAP_ACCEPTED_CLEAR_MS : SWAP_CLEAR_MS),
    state: end,
  }
}

function rollAnswer(random: () => number): SimChampSwapEnd {
  const roll = random()

  if (roll < SWAP_ACCEPT_CHANCE) {
    return 'ACCEPTED'
  }

  return roll < SWAP_ACCEPT_CHANCE + SWAP_DECLINE_CHANCE ? 'DECLINED' : 'CANCELLED'
}

// A waiting swap ends on its own, and an ended one clears, in any phase
function advanceSwap(current: SimChampSelect, now: number): SimChampSelect {
  const swap = current.championSwap

  if (!swap || now < swap.dueAt) {
    return current
  }

  const next = structuredClone(current)

  if (swap.state === 'SENT' || swap.state === 'RECEIVED') {
    endSwap(next, swap.outcome, now)
  } else {
    next.championSwap = null
  }

  return commit(current, next, now)
}

// ARAM has no planning: each player gets two cards, three with the blessing, and every pick runs at once
function dealCards(champSelect: SimChampSelect, now: number, random: () => number): void {
  const deck = shuffle(CARD_POOL, random)

  champSelect.phase = 'BAN_PICK'
  setTimer(champSelect, now, CARDS_MS)

  champSelect.actions = [
    champSelect.cells.map((cell) => {
      const action = createAction(cell.cellId, cell.cellId, 'pick')

      cell.cards = deck.splice(0, random() < THIRD_CARD_CHANCE ? 3 : 2)

      if (cell.cellId !== champSelect.localCellId) {
        const lockAt = now + between(random, 4000, 12_000)

        action.bot = { hoverAt: lockAt, lockAt }
      }

      return action
    }),
  ]
}

function scheduleBenchSwaps(champSelect: SimChampSelect, now: number, random: () => number): void {
  for (const cell of champSelect.cells) {
    if (cell.cellId !== champSelect.localCellId && isLocalTeam(champSelect, cell) && random() < BENCH_SWAP_CHANCE) {
      cell.swapAt = now + between(random, 2000, 25_000)
    }
  }
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

export function createChampSelect({
  hasCards,
  now,
  queueId,
  random,
  seats,
  skipped,
}: CreateChampSelectOptions): SimChampSelect {
  const team = random() < 0.5 ? 1 : 2
  const firstCell = team === 1 ? 0 : 5
  const offsets = shuffle([0, 1, 2, 3, 4], random)
  // ARAM assigns no positions
  const positions = hasCards ? [] : assignPositions(seats, random)
  const myTeam = seats.slice(0, 5).map((seat, index): SimChampSelectCell => {
    const position = hasCards ? '' : (positions[index] ?? 'middle')
    const spells = hasCards ? ARAM_SPELLS : SPELLS[position]
    const [spell1Id, spell2Id] = seat.spell1Id > 0 ? [seat.spell1Id, seat.spell2Id] : (spells ?? [4, 14])
    const pool = PICK_POOLS[position] ?? []
    const championId = skipped ? seat.championId || (pool[Math.floor(random() * pool.length)] ?? 1) : 0

    return {
      cards: [],
      cellId: firstCell + (offsets[index] ?? index),
      championId,
      intent: 0,
      position,
      skinId: skipped ? seat.skinId || championId * 1000 : 0,
      spell1Id,
      spell2Id,
      summonerId: seat.summonerId,
      swapAt: null,
      team,
      wardSkinId: -1,
    }
  })
  const theirTeam = shuffle(POSITIONS, random).map((position, index): SimChampSelectCell => {
    return {
      cards: [],
      cellId: (team === 1 ? 5 : 0) + index,
      championId: 0,
      intent: 0,
      position: hasCards ? '' : position,
      skinId: 0,
      spell1Id: 0,
      spell2Id: 0,
      summonerId: 0,
      swapAt: null,
      team: 3 - team,
      wardSkinId: -1,
    }
  })
  const champSelect: SimChampSelect = {
    actions: skipped ? [] : draftActions(),
    bench: [],
    cells: [...myTeam, ...theirTeam].toSorted((a, b) => {
      return a.cellId - b.cellId
    }),
    championSwap: null,
    counter: 1,
    deadline: now + (skipped ? GAME_STARTING_MS : PLANNING_MS),
    gameId: between(random, 1_000_000_000, 2_000_000_000),
    hasCards,
    id: crypto.randomUUID(),
    localCellId: myTeam[0]?.cellId ?? firstCell,
    phase: skipped ? 'GAME_STARTING' : 'PLANNING',
    queueId,
    skipped,
    subteamSize: 0,
    timerAt: now,
    timerTotal: skipped ? 0 : PLANNING_MS,
    turn: 0,
  }

  if (hasCards) {
    dealCards(champSelect, now, random)

    return champSelect
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

// Arena (SimulPickStrategy): no planning, one pick for everyone. The local player's subteam takes a random set of its
// Cells, as the recording's trio sat in 6-8 of 18
export function createArenaChampSelect({
  now,
  optionCount,
  queueId,
  random,
  seats,
  size,
  subteamSize,
}: CreateArenaChampSelectOptions): SimChampSelect {
  const firstCell = Math.floor(random() * Math.floor(size / subteamSize)) * subteamSize
  const offsets = shuffle(
    Array.from({ length: subteamSize }, (_value, index) => {
      return index
    }),
    random,
  )
  const deck = shuffle(CARD_POOL, random)
  const cells = Array.from({ length: size }, (_value, cellId): SimChampSelectCell => {
    const seat = seats[offsets.indexOf(cellId - firstCell)]
    // The other subteams' cells come empty: no player, no spells
    const [spell1Id, spell2Id] = seat ? ARENA_SPELLS : [0, 0]

    return {
      cards: seat ? deck.splice(0, optionCount) : [],
      cellId,
      championId: 0,
      intent: 0,
      position: '',
      skinId: 0,
      spell1Id,
      spell2Id,
      summonerId: seat?.summonerId ?? 0,
      swapAt: null,
      team: 1,
      wardSkinId: -1,
    }
  })
  const localCellId = firstCell + (offsets[0] ?? 0)
  const picks = cells.map(({ cellId }) => {
    const action = createAction(cellId, cellId, 'pick')

    if (cellId !== localCellId) {
      const lockAt = now + between(random, ...ARENA_BOT_LOCK_MS)

      action.bot = { hoverAt: Math.max(now + 300, lockAt - between(random, 300, 4000)), lockAt }
    }

    return action
  })

  return {
    actions: [picks],
    bench: [],
    cells,
    championSwap: null,
    counter: 1,
    deadline: now + ARENA_PICK_MS,
    gameId: between(random, 1_000_000_000, 2_000_000_000),
    hasCards: false,
    id: crypto.randomUUID(),
    localCellId,
    phase: 'BAN_PICK',
    queueId,
    skipped: false,
    subteamSize,
    timerAt: now,
    timerTotal: ARENA_PICK_MS,
    turn: 0,
  }
}

// Arena: the bots lock in their time, the other subteams' as 0 since nobody sees them, and the pick runs out its timer
function advanceArena(current: SimChampSelect, now: number, random: () => number): SimChampSelectStep {
  const next = structuredClone(current)

  for (const action of next.actions.flat()) {
    const cell = findCell(next, action.actorCellId)
    const isShown = cell !== undefined && isShownTeammate(next, cell)

    if (!action.completed && action.bot && now >= action.bot.lockAt) {
      lock(next, action, isShown ? action.championId || chooseChampion(next, action, random) : 0)
    } else if (!action.completed && action.bot && isShown && now >= action.bot.hoverAt && action.championId === 0) {
      hover(next, action, chooseChampion(next, action, random))
    }
  }

  if (now < next.deadline) {
    return { champSelect: commit(current, next, now), outcome: null }
  }

  const local = next.actions.flat().find((action) => {
    return action.actorCellId === next.localCellId
  })

  // As in the draft: the client locks what's hovered, and a pick with nothing hovered dodges
  if (local && !local.completed && local.championId === 0) {
    return { champSelect: current, outcome: 'dodge' }
  }

  if (local && !local.completed) {
    lock(next, local, local.championId)
  }

  // Shortcut: what follows Arena's pick isn't recorded (a stranger dodged first); it starts the game as the draft does
  next.phase = 'GAME_STARTING'
  next.deadline = now + GAME_STARTING_MS
  next.timerTotal = 0

  return { champSelect: commit(current, next, now), outcome: null }
}

// ARAM: bots pick a card in BAN_PICK and some swap with the bench in finalization
function advanceCards(current: SimChampSelect, now: number, random: () => number): SimChampSelect {
  const next = structuredClone(current)

  if (next.phase === 'BAN_PICK') {
    for (const action of next.actions.flat()) {
      // Unrecorded: the local player running out of time; it takes the hovered card, or a random one
      if (!action.completed && (now >= next.deadline || (action.bot !== null && now >= action.bot.lockAt))) {
        pickCard(next, action, action.championId || chooseChampion(next, action, random))
      }
    }

    if (now >= next.deadline) {
      next.phase = 'FINALIZATION'
      setTimer(next, now, FINALIZATION_MS)
      scheduleBenchSwaps(next, now, random)
    }

    return commit(current, next, now)
  }

  for (const cell of next.cells) {
    if (cell.swapAt !== null && now >= cell.swapAt) {
      const again = now + between(random, 3000, 15_000)

      if (next.bench.length > 0) {
        swapWithBench(next, cell, Math.floor(random() * next.bench.length))
      }

      cell.swapAt = random() < BENCH_SWAP_AGAIN_CHANCE && again < next.deadline ? again : null
    }
  }

  if (now >= next.deadline) {
    next.phase = 'GAME_STARTING'
    next.deadline = now + GAME_STARTING_MS
    next.timerTotal = 0
  }

  return commit(current, next, now)
}

export function advanceChampSelect(previous: SimChampSelect, now: number, random: () => number): SimChampSelectStep {
  if (previous.phase === 'GAME_STARTING') {
    return { champSelect: previous, outcome: now >= previous.deadline ? 'start' : null }
  }

  const current = advanceSwap(previous, now)

  if (current.hasCards) {
    return { champSelect: advanceCards(current, now, random), outcome: null }
  }

  if (current.subteamSize) {
    return advanceArena(current, now, random)
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

  const cards = findCell(next, next.localCellId)?.cards ?? []

  // ARAM only takes one of the player's own cards
  if (next.hasCards && !cards.includes(championId)) {
    return null
  }

  // Arena de Valentía: one of the champions dealt, or Valentía
  if (next.subteamSize && cards.length > 0 && championId !== BRAVERY_CHAMPION_ID && !cards.includes(championId)) {
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

  if (patch.completed && next.hasCards) {
    pickCard(next, action, championId)
  } else if (patch.completed) {
    lock(next, action, championId)

    // Arena's one pick runs out its timer
    if (!next.subteamSize) {
      finishTurnIfDone(next, patch.now, patch.random)
    }
  } else {
    hover(next, action, championId)
  }

  return commit(current, next, patch.now)
}

// A request on the swap with the session's trade id
export interface LocalSwapCall {
  id: number
  now: number
}

// POST champion-swaps/{id}/request: the ally answers in a few seconds, or never, and the client cancels at 15 s
export function requestLocalSwap(
  current: SimChampSelect,
  { id, now }: LocalSwapCall,
  random: () => number,
): SimChampSelect | null {
  const cell = findTradeCell(current, id)
  const local = findCell(current, current.localCellId)

  if (!cell || !local || readTradeState(current, cell) !== 'AVAILABLE') {
    return null
  }

  const outcome = rollAnswer(random)
  const next = structuredClone(current)

  next.championSwap = {
    cellId: cell.cellId,
    dueAt: now + (outcome === 'CANCELLED' ? SWAP_CANCEL_MS : between(random, 2000, 8000)),
    isLocalRequester: true,
    outcome,
    requesterChampionId: local.championId,
    responderChampionId: cell.championId,
    state: 'SENT',
  }

  return commit(current, next, now)
}

// An ally asks the local player for their champion; unanswered, the ally's client cancels at 15 s
export function receiveSwap(current: SimChampSelect, now: number, random: () => number): SimChampSelect {
  const local = findCell(current, current.localCellId)
  const open = readTradeCells(current).filter((cell) => {
    return findTradeCell(current, tradeId(cell.cellId)) && readTradeState(current, cell) === 'AVAILABLE'
  })
  const cell = open[Math.floor(random() * open.length)]

  if (!cell || !local) {
    return current
  }

  const next = structuredClone(current)

  next.championSwap = {
    cellId: cell.cellId,
    dueAt: now + SWAP_CANCEL_MS,
    isLocalRequester: false,
    outcome: 'CANCELLED',
    requesterChampionId: cell.championId,
    responderChampionId: local.championId,
    state: 'RECEIVED',
  }

  return commit(current, next, now)
}

const SWAP_ANSWERS = {
  accept: { end: 'ACCEPTED', from: 'RECEIVED' },
  cancel: { end: 'CANCELLED', from: 'SENT' },
  decline: { end: 'DECLINED', from: 'RECEIVED' },
} as const

export type SwapAnswer = keyof typeof SWAP_ANSWERS

// POST champion-swaps/{id}/accept, decline or cancel; null when the swap isn't waiting on that side
export function answerLocalSwap(
  current: SimChampSelect,
  { id, now }: LocalSwapCall,
  answer: SwapAnswer,
): SimChampSelect | null {
  const swap = current.championSwap
  const { end, from } = SWAP_ANSWERS[answer]

  if (!swap || tradeId(swap.cellId) !== id || swap.state !== from) {
    return null
  }

  const next = structuredClone(current)

  endSwap(next, end, now)

  return commit(current, next, now)
}

// POST ongoing-champion-swap/{id}/clear, which the client sends once a swap ends
export function clearLocalSwap(current: SimChampSelect, { id, now }: LocalSwapCall): SimChampSelect | null {
  const swap = current.championSwap

  if (!swap || tradeId(swap.cellId) !== id || swap.state === 'SENT' || swap.state === 'RECEIVED') {
    return null
  }

  return commit(current, { ...current, championSwap: null }, now)
}

// /lol-champ-select/v1/ongoing-champion-swap, by indexes into myTeam; null when there's none
export function ongoingSwapDto(champSelect: SimChampSelect): Record<string, unknown> | null {
  const swap = champSelect.championSwap

  if (!swap || champSelect.phase === 'GAME_STARTING') {
    return null
  }

  const team = champSelect.cells.filter((cell) => {
    return isLocalTeam(champSelect, cell)
  })
  const otherIndex = team.findIndex((cell) => {
    return cell.cellId === swap.cellId
  })
  const localIndex = team.findIndex((cell) => {
    return cell.cellId === champSelect.localCellId
  })

  // Shortcut: no names or splashes, which need game data the captures lack; add them if loom ever reads them
  return {
    id: tradeId(swap.cellId),
    initiatedByLocalPlayer: swap.isLocalRequester,
    otherSummonerIndex: otherIndex,
    requesterChampionId: swap.requesterChampionId,
    requesterChampionName: '',
    requesterChampionSplashPath: '',
    requesterChampionSquarePortrait: `/lol-game-data/assets/v1/champion-icons/${swap.requesterChampionId}.png`,
    responderChampionName: '',
    responderChampionSquarePortrait: `/lol-game-data/assets/v1/champion-icons/${swap.responderChampionId}.png`,
    responderIndex: swap.isLocalRequester ? otherIndex : localIndex,
    state: swap.state,
    type: 'CHAMPION',
  }
}

// ARAM's POST bench/swap, null when the LCU would refuse it. In finalization it takes any bench champion.
// While cards are picked only the player's own other cards, as the client greys out the rest ("Will unlock shortly")
export function swapLocalWithBench(current: SimChampSelect, championId: number, now: number): SimChampSelect | null {
  const next = structuredClone(current)
  const cell = findCell(next, next.localCellId)
  const index = next.bench.indexOf(championId)
  const isOpen = next.phase === 'FINALIZATION' || (next.phase === 'BAN_PICK' && cell?.cards.includes(championId))

  if (!cell || cell.championId <= 0 || index === -1 || !isOpen) {
    return null
  }

  swapWithBench(next, cell, index)

  return commit(current, next, now)
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
    cells: champSelect.cells.map((cell) => {
      return cell.swapAt === null ? cell : { ...cell, swapAt: cell.swapAt + shift }
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
      const cell = findCell(champSelect, action.actorCellId)
      const isAllyAction = cell?.team === team
      // The other team's bans show once the reveal starts
      const isHidden = turn === 0 && action.type === 'ban' && !isAllyAction
      // ARAM never shows the other team's champions, nor Arena the other subteams'
      const isSecret = (champSelect.hasCards && !isAllyAction) || (cell !== undefined && !isShownTeammate(champSelect, cell))

      return {
        actorCellId: action.actorCellId,
        championId: isHidden || isSecret ? 0 : action.championId,
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
        const isShown = isAlly || !champSelect.hasCards

        return memberDto(
          { ...cell, championId: isShown ? cell.championId : 0 },
          isAlly && isShownTeammate(champSelect, cell),
          findPerson(cell.summonerId),
        )
      })
  }

  return {
    actions,
    allowBattleBoost: champSelect.hasCards,
    allowDuplicatePicks: champSelect.subteamSize > 0,
    allowLockedEvents: false,
    allowPlayerPickSameChampion: false,
    allowRerolling: champSelect.hasCards,
    allowSkinSelection: !champSelect.skipped,
    allowSubsetChampionPicks: champSelect.hasCards,
    bans: { myTeamBans: [], numBans: 0, theirTeamBans: [] },
    benchChampions: champSelect.bench.map((championId) => {
      return { championId, isPriority: false }
    }),
    benchEnabled: champSelect.hasCards,
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
    hasSimultaneousPicks: champSelect.skipped || champSelect.hasCards || champSelect.subteamSize > 0,
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
    // One per ally while picks and finalization run, gone in planning and once the game starts
    trades: readTradeCells(champSelect).flatMap((cell) => {
      const id = tradeId(cell.cellId)

      return findTradeCell(champSelect, id) ? [{ cellId: cell.cellId, id, state: readTradeState(champSelect, cell) }] : []
    }),
  }
}
