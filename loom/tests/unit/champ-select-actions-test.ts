import { describe, expect, test } from 'vitest'

import { CellId, ChampionId, QueueId } from '@/core/types/branded'
import {
  createChampSelectPatch,
  deriveChampSelectState,
  updateLocalMemberSelection,
  updateSessionAction,
} from '@/features/champ-select/champ-select-actions'

import type { ChampSelectSession } from '@/features/champ-select/champ-select-actions'

function createDraftSession(): ChampSelectSession {
  return {
    actions: [
      [{ actorCellId: CellId(1), championId: ChampionId(0), completed: false, id: 11, isAllyAction: true, type: 'ban' }],
      [{ actorCellId: CellId(6), championId: ChampionId(0), completed: false, id: 12, isAllyAction: false, type: 'ban' }],
      [{ actorCellId: CellId(1), championId: ChampionId(0), completed: false, id: 21, isAllyAction: true, type: 'pick' }],
    ],
    localPlayerCellId: CellId(1),
    myTeam: [{ cellId: CellId(1), championId: ChampionId(0), displayName: 'Local Player' }],
    queueId: QueueId(420),
    theirTeam: [{ cellId: CellId(6), championId: ChampionId(0), displayName: 'Opponent' }],
    timer: { adjustedTimeLeftInPhase: 25_000, phase: 'BAN_PICK', totalTimeInPhase: 30_000 },
  }
}

describe('champ-select domain', () => {
  test('hydrates the active local ban turn from a session', () => {
    const session = createDraftSession()
    const derived = deriveChampSelectState(session)

    expect(derived).toMatchObject({
      bannedChampions: [],
      currentAction: expect.objectContaining({ id: 11, type: 'ban' }),
      isMyTurn: true,
      localPlayerCellId: 1,
      phase: 'ban',
      timer: 25,
    })

    const patch = createChampSelectPatch({ selectedChampion: ChampionId(2), session }, true)
    expect(patch).toEqual({ championId: ChampionId(2), completed: true, type: 'ban' })
  })

  test('advances to local pick turn and locks in champion intent', () => {
    const session = createDraftSession()

    session.actions?.[0]?.splice(0, 1, {
      actorCellId: CellId(1),
      championId: ChampionId(2),
      completed: true,
      id: 11,
      isAllyAction: true,
      type: 'ban',
    })
    session.actions?.[1]?.splice(0, 1, {
      actorCellId: CellId(6),
      championId: ChampionId(4),
      completed: true,
      id: 12,
      isAllyAction: false,
      type: 'ban',
    })

    const derived = deriveChampSelectState(session)
    expect(derived).toMatchObject({
      bannedChampions: [2, 4],
      currentAction: expect.objectContaining({ id: 21, type: 'pick' }),
      isMyTurn: true,
      phase: 'pick',
    })

    const hoverPatch = createChampSelectPatch({ selectedChampion: ChampionId(3), session }, false)
    expect(hoverPatch).toEqual({ championId: ChampionId(3), completed: false, type: 'pick' })

    const hoveredSession = updateSessionAction({ actionId: 21, championId: ChampionId(3), completed: false, session })
    const hoveredTeam = updateLocalMemberSelection({
      cellId: CellId(1),
      championId: ChampionId(3),
      locked: false,
      team: hoveredSession?.myTeam ?? [],
    })
    expect(hoveredTeam).toEqual([
      expect.objectContaining({ cellId: CellId(1), championId: ChampionId(0), championPickIntent: ChampionId(3) }),
    ])

    const lockPatch = createChampSelectPatch({ selectedChampion: ChampionId(3), session: hoveredSession ?? null }, true)
    expect(lockPatch).toEqual({ championId: ChampionId(3), completed: true, type: 'pick' })
  })

  test('rejects action patches when it is not the local player turn', () => {
    const session = createDraftSession()

    session.actions?.[0]?.splice(0, 1, {
      actorCellId: CellId(1),
      championId: ChampionId(2),
      completed: true,
      id: 11,
      isAllyAction: true,
      type: 'ban',
    })

    const derived = deriveChampSelectState(session)
    expect(derived).toMatchObject({ currentAction: null, isMyTurn: false, phase: 'ban' })

    expect(createChampSelectPatch({ selectedChampion: ChampionId(3), session }, false)).toBeNull()
    expect(createChampSelectPatch({ selectedChampion: ChampionId(3), session }, true)).toBeNull()
  })
})
