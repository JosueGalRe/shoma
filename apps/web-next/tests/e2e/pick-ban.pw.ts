import { expect, test } from '@playwright/test'

import type { ChampSelectSession } from '../../src/features/champ-select/champ-select-store'
import {
  buildChampionOptions,
  canSwapBenchChampion,
  getBenchChampionOptions,
  getBannedChampionIds,
  getCurrentTurn,
  getPickedChampionIds,
  getTurnState,
  resolveTimeoutAction,
} from '../../src/features/champ-select/pick-ban-logic'

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
  test('complete pick/ban sequence filters legal champions and advances turns', () => {
    const session = createDraftSession()

    expect(getTurnState(session)).toMatchObject({ isLocalTurn: true, phase: 'ban' })
    expect(getCurrentTurn(session)?.[0]?.id).toBe(11)
    expect(
      buildChampionOptions({
        allChampionIds: [1, 2, 3, 4],
        bannableChampionIds: [1, 2],
        phase: 'ban',
        pickableChampionIds: [3, 4],
        session,
      }).filter((option) => option.isActionable),
    ).toEqual([
      expect.objectContaining({ championId: 1 }),
      expect.objectContaining({ championId: 2 }),
    ])

    session.actions?.[0]?.splice(0, 1, { actorCellId: 1, championId: 2, completed: true, id: 11, isAllyAction: true, type: 'ban' })
    expect(getBannedChampionIds(session)).toEqual(new Set([2]))
    expect(getTurnState(session)).toMatchObject({ isLocalTurn: false, phase: 'ban' })

    session.actions?.[1]?.splice(0, 1, { actorCellId: 6, championId: 4, completed: true, id: 12, isAllyAction: false, type: 'ban' })
    expect(getTurnState(session)).toMatchObject({ isLocalTurn: true, phase: 'pick' })

    const pickOptions = buildChampionOptions({
      allChampionIds: [1, 2, 3, 4],
      bannableChampionIds: [1, 2, 3, 4],
      phase: 'pick',
      pickableChampionIds: [1, 3],
      session,
    })

    expect(pickOptions.find((option) => option.championId === 2)).toMatchObject({ availability: 'banned', isActionable: false })
    expect(pickOptions.find((option) => option.championId === 3)).toMatchObject({ availability: 'available', isActionable: true })

    session.actions?.[2]?.splice(0, 1, { actorCellId: 1, championId: 3, completed: true, id: 21, isAllyAction: true, type: 'pick' })
    session.myTeam = [{ cellId: 1, championId: 3, displayName: 'Local Player' }]

    expect(getPickedChampionIds(session)).toEqual(new Set([3]))
    expect(getTurnState(session)).toMatchObject({ isLocalTurn: false, phase: 'idle' })
  })

  test('bench selection only allows ARAM bench champions', () => {
    const session: ChampSelectSession = {
      benchChampionIds: [11, 12, 12, 13],
      benchEnabled: true,
      localPlayerCellId: 1,
      timer: { adjustedTimeLeftInPhase: 15_000, phase: 'BAN_PICK' },
    }

    expect(getBenchChampionOptions(session)).toEqual([11, 12, 13])
    expect(canSwapBenchChampion(session, 12)).toBe(true)
    expect(canSwapBenchChampion(session, 99)).toBe(false)
    expect(canSwapBenchChampion({ ...session, benchEnabled: false }, 12)).toBe(false)
  })

  test('timeout resolves to empty ban or first legal random pick', () => {
    const banSession = createDraftSession()
    expect(resolveTimeoutAction({ session: banSession, timer: 0 })).toMatchObject({ championId: 0, shouldCommit: true })

    const pickSession = createDraftSession()
    pickSession.actions?.[0]?.splice(0, 1, { actorCellId: 1, championId: 2, completed: true, id: 11, type: 'ban' })
    pickSession.actions?.[1]?.splice(0, 1, { actorCellId: 6, championId: 4, completed: true, id: 12, type: 'ban' })
    pickSession.myTeam = [{ cellId: 1, championId: 3, displayName: 'Already Picked' }]

    expect(
      resolveTimeoutAction({
        fallbackChampionIds: [5],
        pickableChampionIds: [3, 7, 8],
        session: pickSession,
        timer: 0,
      }),
    ).toMatchObject({ action: expect.objectContaining({ id: 21, type: 'pick' }), championId: 7, shouldCommit: true })

    expect(resolveTimeoutAction({ session: pickSession, timer: 3 })).toEqual({ action: null, championId: null, shouldCommit: false })
  })
})
