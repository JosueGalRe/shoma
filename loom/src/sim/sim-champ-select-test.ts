import { describe, expect, it } from 'vitest'

import {
  advanceChampSelect,
  answerLocalSwap,
  champSelectSessionDto,
  createChampSelect,
  fastForwardChampSelect,
  ongoingSwapDto,
  patchLocalAction,
  receiveSwap,
  requestLocalSwap,
  swapLocalWithBench,
} from './sim-champ-select'

import type { SimSeat } from './sim-champ-select'
import type { SimChampSelect, SimChampSelectAction } from './sim-types'

const TICK_MS = 500

function seeded(seed: number): () => number {
  let state = seed

  return () => {
    state = (state * 16_807) % 2_147_483_647

    return state / 2_147_483_647
  }
}

function seat(summonerId: number, position: string): SimSeat {
  return { championId: 0, position, skinId: 0, spell1Id: 0, spell2Id: 0, summonerId }
}

// A teammate who never answers a swap, as the recorded one
function unanswered(): number {
  return 0.99
}

const SEATS = [seat(1, 'MIDDLE'), seat(2, 'FILL'), seat(3, 'FILL'), seat(4, 'FILL'), seat(5, 'FILL')]

function readRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value : []
}

class Draft {
  champSelect: SimChampSelect
  now = 0
  outcome: string | null = null
  readonly random = seeded(42)

  constructor(hasCards = false) {
    this.champSelect = createChampSelect({
      hasCards,
      now: 0,
      queueId: hasCards ? 450 : 400,
      random: this.random,
      seats: SEATS,
      skipped: false,
    })
  }

  get localCards(): number[] {
    return (
      this.champSelect.cells.find((cell) => {
        return cell.cellId === this.champSelect.localCellId
      })?.cards ?? []
    )
  }

  get trades(): Record<string, unknown>[] {
    return readRecords(this.session.trades)
  }

  // Picks the local card and lets every bot pick theirs
  pickAll(): void {
    this.act('pick', this.localCards[0] ?? 0, true)

    this.runUntil(() => {
      return this.now >= 12_500
    })
  }

  championOf(cellId: number): number {
    return (
      this.champSelect.cells.find((cell) => {
        return cell.cellId === cellId
      })?.championId ?? 0
    )
  }

  swap(championId: number): boolean {
    const next = swapLocalWithBench(this.champSelect, championId, this.now)

    this.champSelect = next ?? this.champSelect

    return next !== null
  }

  get session(): Record<string, unknown> {
    return champSelectSessionDto(this.champSelect, () => {
      return null
    })
  }

  get timer(): Record<string, unknown> {
    const { timer } = this.session

    return typeof timer === 'object' && timer !== null ? { ...timer } : {}
  }

  get localMember(): Record<string, unknown> | undefined {
    return readRecords(this.session.myTeam).find((member) => {
      return member.cellId === this.champSelect.localCellId
    })
  }

  localAction(type: SimChampSelectAction['type']): SimChampSelectAction {
    const action = this.champSelect.actions.flat().find((candidate) => {
      return candidate.type === type && candidate.actorCellId === this.champSelect.localCellId
    })

    if (!action) {
      throw new Error(`no local ${type}`)
    }

    return action
  }

  act(type: SimChampSelectAction['type'], championId: number, completed: boolean): boolean {
    const next = patchLocalAction(this.champSelect, {
      actionId: this.localAction(type).id,
      championId,
      completed,
      now: this.now,
      random: this.random,
    })

    this.champSelect = next ?? this.champSelect

    return next !== null
  }

  runUntil(isDone: (champSelect: SimChampSelect) => boolean): void {
    while (!isDone(this.champSelect) && this.outcome === null && this.now < 600_000) {
      this.now += TICK_MS

      const step = advanceChampSelect(this.champSelect, this.now, this.random)

      this.champSelect = step.champSelect
      this.outcome = step.outcome
    }
  }
}

describe('sim champ select', () => {
  it('runs a draft from planning to the game start, with bots taking their turns', () => {
    const draft = new Draft()

    expect(draft.timer).toMatchObject({ adjustedTimeLeftInPhase: 12_000, phase: 'PLANNING' })
    expect(draft.localMember).toMatchObject({ assignedPosition: 'middle', nameVisibilityType: 'VISIBLE' })

    // Planning declares the pick; the ban waits for its turn
    expect(draft.act('pick', 103, false)).toBe(true)
    expect(draft.localMember).toMatchObject({ championPickIntent: 103 })
    expect(draft.act('ban', 1, true)).toBe(false)

    draft.runUntil((champSelect) => {
      return champSelect.phase === 'BAN_PICK'
    })

    expect(draft.timer).toMatchObject({ adjustedTimeLeftInPhase: 25_000, phase: 'BAN_PICK', totalTimeInPhase: 25_000 })
    expect(draft.act('ban', 1, true)).toBe(true)

    draft.runUntil(() => {
      return draft.now >= 22_000
    })

    // The other team's bans stay hidden until the reveal
    const theirCells = draft.champSelect.cells.filter((cell) => {
      return cell.team !== draft.localMember?.team
    })
    const theirBans = draft.champSelect.actions[0]?.filter((action) => {
      return theirCells.some((cell) => {
        return cell.cellId === action.actorCellId
      })
    })
    const shownBans = readRecords(readRecords(draft.session.actions)[0]).filter((action) => {
      return action.isAllyAction === false
    })

    expect(draft.champSelect.turn).toBe(0)

    expect(
      theirBans?.some((action) => {
        return action.completed
      }),
    ).toBe(true)

    expect(shownBans).toHaveLength(5)

    expect(
      shownBans.every((action) => {
        return action.championId === 0 && action.isInProgress === true && action.completed === false
      }),
    ).toBe(true)

    draft.runUntil((champSelect) => {
      return champSelect.turn === 2
    })

    // The reveal's timer runs on into the first pick, unrefreshed
    expect(draft.timer).toMatchObject({ totalTimeInPhase: 31_400 })
    expect(draft.champSelect.timerAt).toBeLessThan(draft.now - 6000)

    draft.runUntil((champSelect) => {
      return champSelect.actions.some((group, turn) => {
        return turn === champSelect.turn && group.includes(draft.localAction('pick'))
      })
    })

    expect(draft.act('pick', 103, true)).toBe(true)
    expect(draft.localMember).toMatchObject({ championId: 103, championPickIntent: 0, selectedSkinId: 103_000 })

    draft.runUntil((champSelect) => {
      return champSelect.phase === 'FINALIZATION'
    })

    const picks = draft.champSelect.cells.map((cell) => {
      return cell.championId
    })

    expect(new Set(picks).size).toBe(10)
    expect(picks).not.toContain(0)
    expect(draft.timer).toMatchObject({ phase: 'FINALIZATION', totalTimeInPhase: 30_000 })

    draft.runUntil(() => {
      return false
    })

    expect(draft.outcome).toBe('start')
  })

  it('dodges when the local pick runs out with nothing hovered', () => {
    const draft = new Draft()

    draft.runUntil(() => {
      return false
    })

    expect(draft.outcome).toBe('dodge')
    // An unanswered ban locks as no ban
    expect(draft.localAction('ban')).toMatchObject({ championId: 0, completed: true })
  })

  it('fast-forwards to the local pick with the times relative to now', () => {
    const draft = new Draft()
    const champSelect = fastForwardChampSelect(draft.champSelect, { now: 1000, random: draft.random, target: 'pick' })
    const pick = champSelect.actions[champSelect.turn]?.find((action) => {
      return action.actorCellId === champSelect.localCellId
    })

    expect(pick).toMatchObject({ completed: false, type: 'pick' })
    expect(champSelect.timerAt).toBe(1000)
    expect(champSelect.deadline - 1000).toBeGreaterThan(0)
    expect(champSelect.deadline - 1000).toBeLessThanOrEqual(31_400)

    const final = fastForwardChampSelect(draft.champSelect, { now: 1000, random: draft.random, target: 'finalization' })
    const localCell = final.cells.find((cell) => {
      return cell.cellId === final.localCellId
    })

    expect(final.phase).toBe('FINALIZATION')
    expect(localCell?.championId).toBeGreaterThan(0)
  })

  it('refuses a champion that is already locked', () => {
    const draft = new Draft()

    draft.runUntil((champSelect) => {
      return champSelect.turn >= 2
    })

    const banned = draft.champSelect.actions[0]?.find((action) => {
      return action.championId > 0
    })

    expect(draft.act('pick', banned?.championId ?? -1, false)).toBe(false)
  })
})

describe('sim ARAM champ select', () => {
  it('deals cards, keeps BAN_PICK its 15 s, and hides the other team', () => {
    const aram = new Draft(true)
    const cards = aram.champSelect.cells.flatMap((cell) => {
      return cell.cards
    })

    expect(aram.timer).toMatchObject({ adjustedTimeLeftInPhase: 15_000, phase: 'BAN_PICK', totalTimeInPhase: 15_000 })
    expect(aram.session).toMatchObject({ allowSubsetChampionPicks: true, benchEnabled: true, hasSimultaneousPicks: true })
    expect(aram.localMember).toMatchObject({ assignedPosition: '', spell1Id: 32, spell2Id: 4 })
    expect(new Set(cards).size).toBe(cards.length)

    expect(
      aram.champSelect.cells.every((cell) => {
        return cell.cards.length === 2 || cell.cards.length === 3
      }),
    ).toBe(true)

    const [card = 0, ...rest] = aram.localCards
    const notMine = cards.find((championId) => {
      return !aram.localCards.includes(championId)
    })

    expect(aram.act('pick', notMine ?? 0, true)).toBe(false)
    expect(aram.act('pick', card, true)).toBe(true)
    expect(aram.localMember).toMatchObject({ championId: card })
    expect(aram.champSelect.bench).toEqual(rest)

    aram.runUntil(() => {
      return aram.now >= 14_500
    })

    const allies = aram.champSelect.cells.filter((cell) => {
      return cell.team === aram.localMember?.team
    })
    const theirTeam = readRecords(aram.session.theirTeam)

    // Everyone picked, and the phase still runs out its timer
    expect(aram.champSelect.phase).toBe('BAN_PICK')

    expect(
      aram.champSelect.cells.every((cell) => {
        return cell.championId > 0
      }),
    ).toBe(true)

    expect(aram.champSelect.bench).toHaveLength(
      allies.reduce((sum, cell) => {
        return sum + cell.cards.length - 1
      }, 0),
    )

    expect(
      theirTeam.every((member) => {
        return member.championId === 0
      }),
    ).toBe(true)

    aram.runUntil((champSelect) => {
      return champSelect.phase === 'FINALIZATION'
    })

    expect(aram.now).toBe(15_000)
    expect(aram.timer).toMatchObject({ phase: 'FINALIZATION', totalTimeInPhase: 30_000 })

    aram.runUntil(() => {
      return false
    })

    expect(aram.outcome).toBe('start')
  })

  it('swaps with the bench in place: only its own cards while picking, any in finalization', () => {
    const aram = new Draft(true)
    const [card = 0, other = 0] = aram.localCards

    expect(aram.swap(other)).toBe(false)
    expect(aram.act('pick', card, true)).toBe(true)

    aram.runUntil((champSelect) => {
      return champSelect.bench.length > aram.localCards.length - 1
    })

    const allyCard = aram.champSelect.bench.find((championId) => {
      return !aram.localCards.includes(championId)
    })
    const slot = aram.champSelect.bench.indexOf(other)

    expect(aram.swap(allyCard ?? 0)).toBe(false)
    expect(aram.swap(other)).toBe(true)
    expect(aram.localMember).toMatchObject({ championId: other, selectedSkinId: other * 1000 })
    expect(aram.champSelect.bench[slot]).toBe(card)

    aram.runUntil((champSelect) => {
      return champSelect.phase === 'FINALIZATION'
    })

    const benched = aram.champSelect.bench.find((championId) => {
      return !aram.localCards.includes(championId)
    })

    expect(aram.swap(benched ?? 0)).toBe(true)
    expect(aram.localMember).toMatchObject({ championId: benched })
  })

  it('takes one of the local cards when the pick runs out', () => {
    const aram = new Draft(true)

    aram.runUntil((champSelect) => {
      return champSelect.phase === 'FINALIZATION'
    })

    expect(aram.localCards).toContain(aram.localMember?.championId)
  })

  it('opens champion swaps once both sides have a champion, one at a time', () => {
    const aram = new Draft(true)

    expect(new Draft().trades).toEqual([])
    expect(aram.trades).toHaveLength(4)

    expect(
      aram.trades.every((trade) => {
        return trade.state === 'INVALID'
      }),
    ).toBe(true)

    aram.pickAll()

    const [trade, ...others] = aram.trades
    const id = Number(trade?.id)
    const local = aram.localMember?.championId

    expect(trade).toMatchObject({ state: 'AVAILABLE' })

    aram.champSelect = requestLocalSwap(aram.champSelect, { id, now: aram.now }, aram.random) ?? aram.champSelect

    expect(aram.trades[0]).toMatchObject({ id, state: 'SENT' })

    expect(
      aram.trades.slice(1).every((other) => {
        return other.state === 'INVALID'
      }),
    ).toBe(true)

    expect(ongoingSwapDto(aram.champSelect)).toMatchObject({
      id,
      initiatedByLocalPlayer: true,
      requesterChampionId: local,
      state: 'SENT',
      type: 'CHAMPION',
    })

    expect(requestLocalSwap(aram.champSelect, { id: Number(others[0]?.id), now: aram.now }, aram.random)).toBeNull()
  })

  it('cancels an unanswered request at 15 s and clears it 1.7 s later, as the client does', () => {
    const aram = new Draft(true)

    aram.pickAll()

    const id = Number(aram.trades[0]?.id)
    const askedAt = aram.now

    aram.champSelect = requestLocalSwap(aram.champSelect, { id, now: askedAt }, unanswered) ?? aram.champSelect

    aram.runUntil(() => {
      return aram.champSelect.championSwap?.state !== 'SENT'
    })

    expect(aram.now - askedAt).toBe(15_000)
    expect(ongoingSwapDto(aram.champSelect)).toMatchObject({ id, state: 'CANCELLED' })

    aram.runUntil((champSelect) => {
      return champSelect.championSwap === null
    })

    expect(aram.now - askedAt).toBe(17_000)
    expect(aram.trades[0]).toMatchObject({ id, state: 'AVAILABLE' })
  })

  it('trades champions when the local player accepts an ally asking for theirs', () => {
    const aram = new Draft(true)

    aram.pickAll()
    aram.champSelect = receiveSwap(aram.champSelect, aram.now, aram.random)

    const swap = aram.champSelect.championSwap
    const id = Number(ongoingSwapDto(aram.champSelect)?.id)
    const local = aram.championOf(aram.champSelect.localCellId)
    const other = aram.championOf(swap?.cellId ?? -1)

    expect(ongoingSwapDto(aram.champSelect)).toMatchObject({ initiatedByLocalPlayer: false, state: 'RECEIVED' })
    expect(answerLocalSwap(aram.champSelect, { id, now: aram.now }, 'cancel')).toBeNull()

    aram.champSelect = answerLocalSwap(aram.champSelect, { id, now: aram.now }, 'accept') ?? aram.champSelect

    expect(aram.localMember).toMatchObject({ championId: other, selectedSkinId: other * 1000 })
    expect(aram.championOf(swap?.cellId ?? -1)).toBe(local)
    expect(ongoingSwapDto(aram.champSelect)).toMatchObject({ requesterChampionId: other, state: 'ACCEPTED' })

    aram.runUntil((champSelect) => {
      return champSelect.championSwap === null
    })

    expect(aram.now).toBe(13_000)
  })

  it('fast-forwards to finalization with a card picked', () => {
    const aram = new Draft(true)
    const champSelect = fastForwardChampSelect(aram.champSelect, { now: 1000, random: aram.random, target: 'finalization' })
    const localCell = champSelect.cells.find((cell) => {
      return cell.cellId === champSelect.localCellId
    })

    expect(champSelect.phase).toBe('FINALIZATION')
    expect(localCell?.cards).toContain(localCell?.championId)
    expect(champSelect.deadline - 1000).toBe(30_000)
  })
})
