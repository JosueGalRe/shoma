import { beforeEach, describe, expect, it } from 'vitest'

import { initialAramStoreState, useAramStore } from '@/features/champ-select/aram-store'
import {
  initialChampSelectStoreState,
  type ChampSelectSession,
  useChampSelectStore,
} from '@/features/champ-select/champ-select-store'
import { initialSettingsStoreState, useSettingsStore } from '@/core/state/settings-store'
import { useSocialStore } from '@/features/social/social-store'
import { CellId, ChampionId, SpellId } from '@/core/types/branded'

function createPickSession(): ChampSelectSession {
  return {
    actions: [
      [
        {
          actorCellId: CellId(1),
          championId: ChampionId(0),
          completed: false,
          id: 11,
          isAllyAction: true,
          type: 'pick',
        },
      ],
    ],
    localPlayerCellId: CellId(1),
    myTeam: [{ cellId: CellId(1), championId: ChampionId(0), displayName: 'Local Player' }],
    timer: { adjustedTimeLeftInPhase: 25_000, phase: 'BAN_PICK', totalTimeInPhase: 30_000 },
  }
}

function createBanSession(): ChampSelectSession {
  return {
    actions: [
      [
        {
          actorCellId: CellId(1),
          championId: ChampionId(0),
          completed: false,
          id: 21,
          isAllyAction: true,
          type: 'ban',
        },
      ],
    ],
    localPlayerCellId: CellId(1),
    myTeam: [{ cellId: CellId(1), championId: ChampionId(0), displayName: 'Local Player' }],
    timer: { adjustedTimeLeftInPhase: 15_000, phase: 'BAN_PICK', totalTimeInPhase: 30_000 },
  }
}

describe('champ-select stores', () => {
  beforeEach(() => {
    useChampSelectStore.getState().reset()
    useChampSelectStore.getState().setSelectChampionForTurnHandler(null)
    useAramStore.getState().reset()

    useSettingsStore.getState().setLanguage(initialSettingsStoreState.language)
    useSettingsStore.getState().setShowOfflineGroup(initialSettingsStoreState.showOfflineGroup)
    useSettingsStore.getState().setTheme(initialSettingsStoreState.theme)
  })

  it('starts from the exported champ-select defaults', () => {
    expect(useChampSelectStore.getState()).toMatchObject({
      ...initialChampSelectStoreState,
      selection: {
        championId: null,
        runeId: null,
        skinId: null,
        spell1Id: null,
        spell2Id: null,
      },
      session: null,
    })
  })

  it('selects a champion on the local pick turn and locks it in', () => {
    useChampSelectStore.getState().setSession(createPickSession())

    expect(useChampSelectStore.getState().selectChampion(ChampionId(3))).toEqual({
      championId: ChampionId(3),
      completed: false,
      type: 'pick',
    })
    expect(useChampSelectStore.getState()).toMatchObject({
      error: null,
      selectedChampion: ChampionId(3),
      selection: {
        championId: ChampionId(3),
      },
      session: {
        myTeam: [
          {
            cellId: CellId(1),
            championId: ChampionId(0),
            championPickIntent: ChampionId(3),
          },
        ],
      },
    })

    expect(useChampSelectStore.getState().lockIn()).toEqual({
      championId: ChampionId(3),
      completed: true,
      type: 'pick',
    })
    expect(useChampSelectStore.getState()).toMatchObject({
      error: null,
      isMyTurn: false,
      selectedChampion: ChampionId(3),
      session: {
        myTeam: [
          {
            cellId: CellId(1),
            championId: ChampionId(3),
          },
        ],
      },
    })
  })

  it('updates skin and spell selection independently', () => {
    useChampSelectStore.getState().changeSkin(1010)
    useChampSelectStore.getState().changeSpell(1, SpellId(4))
    useChampSelectStore.getState().changeSpell(2, SpellId(6))

    expect(useChampSelectStore.getState().selection).toMatchObject({
      championId: null,
      skinId: 1010,
      spell1Id: SpellId(4),
      spell2Id: SpellId(6),
    })
  })

  it('transitions errors for invalid and valid actions', () => {
    expect(useChampSelectStore.getState().selectChampion(ChampionId(3))).toBeNull()
    expect(useChampSelectStore.getState().error).toBe('champSelect.errors.notYourTurn')

    useChampSelectStore.getState().setError(new Error('boom'))
    expect(useChampSelectStore.getState().error).toBe('errors.generic')

    useChampSelectStore.getState().setSession(createPickSession())
    expect(useChampSelectStore.getState().selectChampion(ChampionId(4))).toEqual({
      championId: ChampionId(4),
      completed: false,
      type: 'pick',
    })
    expect(useChampSelectStore.getState().error).toBe(null)
  })

  it('handles ban turns and resets to defaults', () => {
    useChampSelectStore.getState().setSession(createBanSession())

    expect(useChampSelectStore.getState().ban(ChampionId(9))).toEqual({
      championId: ChampionId(9),
      completed: true,
      type: 'ban',
    })
    expect(useChampSelectStore.getState()).toMatchObject({
      error: null,
      selectedChampion: ChampionId(9),
      session: {
        actions: [[{ championId: ChampionId(9), completed: true, id: 21, type: 'ban' }]],
      },
    })

    useChampSelectStore.getState().reset()
    expect(useChampSelectStore.getState()).toMatchObject(initialChampSelectStoreState)
  })

  it('handles ARAM reroll and bench flow', () => {
    useAramStore.getState().setAramState({
      bench: [ChampionId(11), ChampionId(12)],
      canReroll: true,
      rerollCount: 2,
      hasLoadedRerolls: true,
    })

    expect(useAramStore.getState().reroll()).toBe(true)
    expect(useAramStore.getState()).toMatchObject({
      canReroll: true,
      error: null,
      rerollCount: 1,
    })

    expect(useAramStore.getState().swapBench(ChampionId(11))).toBe(true)
    useAramStore.getState().completeBenchSwap(ChampionId(11))
    expect(useAramStore.getState()).toMatchObject({
      bench: [ChampionId(12)],
      error: null,
    })

    useAramStore.getState().reset()
    expect(useAramStore.getState()).toMatchObject(initialAramStoreState)
  })

  it('surfaces other-store reactions when settings change', () => {
    expect(useSocialStore.getState().showOfflineGroup).toBe(false)

    useSettingsStore.getState().setShowOfflineGroup(true)
    expect(useSocialStore.getState().showOfflineGroup).toBe(true)

    useSettingsStore.getState().setShowOfflineGroup(false)
    expect(useSocialStore.getState().showOfflineGroup).toBe(false)
  })
})
