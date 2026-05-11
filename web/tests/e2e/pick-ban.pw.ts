import { expect, test } from '@playwright/test'

import {
  initialChampSelectStoreState,
  useChampSelectStore,
  type ChampSelectSession,
} from '../../src/features/champ-select/champ-select-store'

function createDraftSession(): ChampSelectSession {
  return {
    actions: [
      [{ actorCellId: 1, championId: 0, completed: false, id: 11, isAllyAction: true, type: 'ban' }],
      [{ actorCellId: 6, championId: 0, completed: false, id: 12, isAllyAction: false, type: 'ban' }],
      [{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }],
    ],
    localPlayerCellId: 1,
    myTeam: [{ cellId: 1, championId: 0, displayName: 'Local Player' }],
    theirTeam: [{ cellId: 6, championId: 0, displayName: 'Opponent' }],
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

    expect(store.getState().ban(2)).toEqual({ championId: 2, completed: true, type: 'ban' })
    expect(store.getState()).toMatchObject({ error: null, selectedChampion: 2 })
  })

  test('advances to local pick turn and locks in champion intent', () => {
    const session = createDraftSession()
    session.actions?.[0]?.splice(0, 1, { actorCellId: 1, championId: 2, completed: true, id: 11, isAllyAction: true, type: 'ban' })
    session.actions?.[1]?.splice(0, 1, { actorCellId: 6, championId: 4, completed: true, id: 12, isAllyAction: false, type: 'ban' })

    const store = useChampSelectStore
    store.getState().setSession(session)

    expect(store.getState()).toMatchObject({
      bannedChampions: [2, 4],
      currentAction: expect.objectContaining({ id: 21, type: 'pick' }),
      isMyTurn: true,
      phase: 'pick',
    })

    expect(store.getState().selectChampion(3)).toEqual({ championId: 3, completed: false, type: 'pick' })
    expect(store.getState().session?.myTeam).toEqual([expect.objectContaining({ cellId: 1, championId: 0, championPickIntent: 3 })])
    expect(store.getState().lockIn()).toEqual({ championId: 3, completed: true, type: 'pick' })
    expect(store.getState()).toMatchObject({ isMyTurn: false, selectedChampion: 3 })
    expect(store.getState().session?.myTeam).toEqual([expect.objectContaining({ cellId: 1, championId: 3 })])
  })

  test('rejects actions when it is not the local player turn', () => {
    const session = createDraftSession()
    session.actions?.[0]?.splice(0, 1, { actorCellId: 1, championId: 2, completed: true, id: 11, isAllyAction: true, type: 'ban' })

    const store = useChampSelectStore
    store.getState().setSession(session)

    expect(store.getState()).toMatchObject({ currentAction: null, isMyTurn: false, phase: 'ban' })
    expect(store.getState().selectChampion(3)).toBeNull()
    expect(store.getState().lockIn()).toBeNull()
    expect(store.getState().error).toBe('champSelect.errors.selectChampionBeforeLockingIn')

    store.getState().reset()
    expect(store.getState()).toMatchObject(initialChampSelectStoreState)
  })
})
