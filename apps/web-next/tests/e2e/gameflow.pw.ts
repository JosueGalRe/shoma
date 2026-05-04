import { expect, test } from '@playwright/test'
import { LcuPaths, type LcuResult } from '@mimic/protocol-contract'

import { canAcceptReadyCheck, canCancelQueue, canPickChampion, canStartQueue, getActionGuardError } from '../../src/core/state/state-guards'
import {
  reconstructGameflowState,
  transitionGameflow,
  validateTransition,
  type LcuGameflowRequest,
} from '../../src/core/state/transitions'

function createLcuRequest(responses: Record<string, LcuResult>): { calls: string[]; request: LcuGameflowRequest } {
  const calls: string[] = []

  return {
    calls,
    request<TContent = unknown>(path: string) {
      calls.push(path)
      return Promise.resolve((responses[path] ?? { content: null, status: 200 }) as LcuResult<TContent>)
    },
  }
}

test.describe('gameflow transitions', () => {
  test('complete flow transitions from lobby to queue to ready check to champ select', async () => {
    const lcu = createLcuRequest({
      [LcuPaths.champSelect.bannableChampionIds]: { content: [1, 2], status: 200 },
      [LcuPaths.champSelect.pickableChampionIds]: { content: [3, 4], status: 200 },
      [LcuPaths.champSelect.session]: { content: { actions: [] }, status: 200 },
    })

    expect(await transitionGameflow('lobby', 'queue')).toMatchObject({ ok: true, to: 'queue' })
    expect(await transitionGameflow('queue', 'readyCheck', { request: lcu.request })).toMatchObject({ ok: true, to: 'readyCheck' })
    expect(await transitionGameflow('readyCheck', 'champSelect')).toMatchObject({ ok: true, to: 'champSelect' })

    expect(lcu.calls).toEqual([
      LcuPaths.champSelect.pickableChampionIds,
      LcuPaths.champSelect.bannableChampionIds,
      LcuPaths.champSelect.session,
    ])
  })

  test('reload during champ select reconstructs phase and hydrates champ select state', async () => {
    const champSelectSession = {
      actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 7, type: 'pick' }]],
      localPlayerCellId: 1,
    }
    const hydrated: unknown[] = []
    const phases: string[] = []
    const lcu = createLcuRequest({
      [LcuPaths.champSelect.session]: { content: champSelectSession, status: 200 },
      [LcuPaths.gameflow.phase]: { content: 'ChampSelect', status: 200 },
    })

    const reconstructed = await reconstructGameflowState({
      hydrators: {
        champSelect(session) {
          hydrated.push(session)
        },
      },
      request: lcu.request,
      setPhase(phase) {
        phases.push(phase)
      },
    })

    expect(reconstructed).toEqual({ phase: 'champSelect', rawPhase: 'ChampSelect' })
    expect(hydrated).toEqual([champSelectSession])
    expect(phases).toEqual(['champSelect'])
    expect(lcu.calls).toEqual([LcuPaths.gameflow.phase, LcuPaths.champSelect.session])
  })

  test('invalid actions and transitions are rejected with clear errors', async () => {
    expect(canStartQueue('lobby')).toBe(true)
    expect(canStartQueue('queue')).toBe(false)
    expect(canAcceptReadyCheck('readyCheck')).toBe(true)
    expect(canAcceptReadyCheck('lobby')).toBe(false)
    expect(canPickChampion('champSelect')).toBe(true)
    expect(canPickChampion('readyCheck')).toBe(false)
    expect(canCancelQueue('queue')).toBe(true)
    expect(canCancelQueue('champSelect')).toBe(false)

    expect(getActionGuardError('pickChampion', 'queue')?.message).toBe(
      'Cannot pick champion while gameflow phase is "queue". Champions can only be picked during champSelect.',
    )

    const validation = validateTransition('lobby', 'champSelect')
    expect(validation.ok).toBe(false)
    if (!validation.ok) {
      expect(validation.error.message).toBe('Invalid gameflow transition from "lobby" to "champSelect".')
    }

    await expect(transitionGameflow('lobby', 'readyCheck')).resolves.toMatchObject({ ok: false })
  })
})
