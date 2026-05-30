import { expect, test } from '@playwright/test'

import { CellId, ChampionId, QueueId } from '../../src/core/types/branded'
import { useChampSelectErrorStore } from '../../src/features/champ-select/champ-select-error-store'
import {
  type ChampSelectSession,
  initialChampSelectStoreState,
  useChampSelectStore,
} from '../../src/features/champ-select/champ-select-store'

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

test.describe('pick/ban logic', () => {
  test.beforeEach(() => {
    useChampSelectStore.getState().reset()
  })

  test('hydrates the active local ban turn from a rebuilt champ-select session', () => {
    const store = useChampSelectStore

    store.getState().setSession(createDraftSession())

    expect(store.getState()).toMatchObject({
      bannedChampions: [],
      currentAction: expect.objectContaining({ id: 11, type: 'ban' }),
      isMyTurn: true,
      localPlayerCellId: 1,
      phase: 'ban',
      selectedChampion: null,
      timer: 25,
    })

    expect(store.getState().ban(ChampionId(2))).toEqual({ championId: ChampionId(2), completed: true, type: 'ban' })
    expect(store.getState()).toMatchObject({ error: null, selectedChampion: ChampionId(2) })
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

    const store = useChampSelectStore

    store.getState().setSession(session)

    expect(store.getState()).toMatchObject({
      bannedChampions: [2, 4],
      currentAction: expect.objectContaining({ id: 21, type: 'pick' }),
      isMyTurn: true,
      phase: 'pick',
    })

    expect(store.getState().selectChampion(ChampionId(3))).toEqual({ championId: ChampionId(3), completed: false, type: 'pick' })

    expect(store.getState().session?.myTeam).toEqual([
      expect.objectContaining({ cellId: CellId(1), championId: ChampionId(0), championPickIntent: ChampionId(3) }),
    ])

    expect(store.getState().lockIn()).toEqual({ championId: ChampionId(3), completed: true, type: 'pick' })
    expect(store.getState()).toMatchObject({ isMyTurn: false, selectedChampion: ChampionId(3) })
    expect(store.getState().session?.myTeam).toEqual([expect.objectContaining({ cellId: CellId(1), championId: ChampionId(3) })])
  })

  test('rejects actions when it is not the local player turn', () => {
    const session = createDraftSession()

    session.actions?.[0]?.splice(0, 1, {
      actorCellId: CellId(1),
      championId: ChampionId(2),
      completed: true,
      id: 11,
      isAllyAction: true,
      type: 'ban',
    })

    const store = useChampSelectStore

    store.getState().setSession(session)

    expect(store.getState()).toMatchObject({ currentAction: null, isMyTurn: false, phase: 'ban' })
    expect(store.getState().selectChampion(ChampionId(3))).toBeNull()
    expect(store.getState().lockIn()).toBeNull()
    expect(useChampSelectErrorStore.getState().error).toBe('champSelect.errors.selectChampionBeforeLockingIn')

    store.getState().reset()
    expect(store.getState()).toMatchObject({ ...initialChampSelectStoreState })
  })
})
