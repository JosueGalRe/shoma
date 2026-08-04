import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type ChampionSkin,
  type ChampionSummary,
  type RuneTree,
  useChampions,
  useChampionSkins,
  useRunes,
} from '@/core/http/ddragon'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  bannableChampionIdsDescriptor,
  champSelectSessionDescriptor,
  createLcuQueryOptions,
  perksCurrentPageDescriptor,
  pickableChampionIdsDescriptor,
  pickableSkinIdsDescriptor,
  subsetChampionListDescriptor,
  type SummonerSpell,
  summonerSpellsDescriptor,
  wardSkinsDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { type CellId, type ChampionId as ChampionIdType, RuneId, type SpellId } from '@/core/types/branded'
import {
  type ChampSelectAction,
  type ChampSelectMember,
  type ChampSelectPhase,
  type ChampSelectSession,
  createChampSelectPatch,
  deriveChampSelectState,
} from '@/features/champ-select/champ-select-actions'
import { patchChampSelectAction, patchMySelection, swapBenchChampion } from '@/features/champ-select/champ-select-mutations'
import { type GameMode, resolveGameMode } from '@/features/modes/mode-engine'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/use-countdown'

import type { WardSkin } from '@/core/lcu/parsers/champ-select'

export interface ChampSelectAramState {
  bench: ChampionIdType[]
  cards: ChampionIdType[]
  error: string | null
  isLoading: boolean
  swapBench: (championId: ChampionIdType) => Promise<boolean>
}

export interface ChampSelectSelectionState {
  championId: ChampionIdType | null
  skinId: number | null
  spell1Id: SpellId | null
  spell2Id: SpellId | null
  wardSkinId: number | null
}

export interface UseChampSelectResult {
  actions: ChampSelectAction[][]
  aram: ChampSelectAramState
  banChampion: (championId: ChampionIdType) => Promise<boolean>
  bannableChampionIds: ChampionIdType[]
  bannedChampions: ChampionIdType[]
  benchChampionIds: ChampionIdType[]
  champions: ChampionSummary[]
  championSkins: ChampionSkin[]
  changeSkin: (skinId: number) => Promise<boolean>
  changeSpell: (slot: 1 | 2, spellId: SpellId) => Promise<boolean>
  changeWardSkin: (wardSkinId: number) => Promise<boolean>
  currentAction: ChampSelectAction | null
  dataError: string | null
  enemyTeam: ChampSelectMember[]
  error: string | null
  isAram: boolean
  isArena: boolean
  isLoading: boolean
  isMyTurn: boolean
  localPlayerCellId: CellId | null
  lockInChampion: () => Promise<boolean>
  mode: GameMode
  ownedSkinIds: number[]
  phase: ChampSelectPhase
  pickableChampionIds: ChampionIdType[]
  runeTrees: RuneTree[]
  selectChampionForTurn: (championId: ChampionIdType) => Promise<boolean>
  selectedChampion: ChampionIdType | null
  selectedRuneId: RuneId | null
  selection: ChampSelectSelectionState
  session: ChampSelectSession | null
  summonerSpells: SummonerSpell[]
  team: ChampSelectMember[]
  timer: number
  wardSkins: WardSkin[]
}

interface SelectionOverride {
  skinId?: number
  spell1Id?: SpellId
  spell2Id?: SpellId
  wardSkinId?: number
}

export function useChampSelect(): UseChampSelectResult {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()

  const sessionQuery = useQuery(createLcuQueryOptions(champSelectSessionDescriptor, transport))
  const subsetListQuery = useQuery(createLcuQueryOptions(subsetChampionListDescriptor, transport))
  const spellsQuery = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))
  const currentRunePageQuery = useQuery(createLcuQueryOptions(perksCurrentPageDescriptor, transport))
  const pickableChampionIdsQuery = useQuery(createLcuQueryOptions(pickableChampionIdsDescriptor, transport))
  const bannableChampionIdsQuery = useQuery(createLcuQueryOptions(bannableChampionIdsDescriptor, transport))
  const pickableSkinIdsQuery = useQuery(createLcuQueryOptions(pickableSkinIdsDescriptor, transport))
  const championsQuery = useChampions()
  const runesQuery = useRunes()

  useLcuObserverSync(champSelectSessionDescriptor, transport)
  useLcuObserverSync(subsetChampionListDescriptor, transport)

  const session = sessionQuery.data ?? null
  const derived = deriveChampSelectState(session)

  const mode = resolveGameMode({
    benchEnabled: session?.benchEnabled ?? derived.benchChampionIds.length > 0,
    gameMode: session?.gameMode,
    mapId: session?.mapId,
    queueId: session?.queueId,
  })

  const localMember = derived.team.find((member) => {
    return member.cellId === derived.localPlayerCellId
  })

  const localSummonerId = localMember?.summonerId ?? 0
  const wardSkinsQuery = useQuery({
    ...createLcuQueryOptions(wardSkinsDescriptor(localSummonerId), transport),
    enabled: Boolean(transport) && localSummonerId > 0,
  })

  // Local overrides: instant feedback for selections that the session confirms later.
  const [previewOverride, setPreviewOverride] = useState<ChampionIdType | null>(null)
  const [selectionOverride, setSelectionOverride] = useState<SelectionOverride>({})
  const [error, setError] = useState<string | null>(null)
  const [aramError, setAramError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  useEffect(() => {
    if (!session) {
      setPreviewOverride(null)
      setSelectionOverride({})
    }
  }, [session])

  const sessionSelectedChampion =
    derived.currentAction?.championId || localMember?.championPickIntent || localMember?.championId || null
  const selectedChampion = (previewOverride ?? sessionSelectedChampion) || null

  const selection: ChampSelectSelectionState = {
    championId: selectedChampion,
    skinId: selectionOverride.skinId ?? localMember?.selectedSkinId ?? null,
    spell1Id: selectionOverride.spell1Id ?? localMember?.spell1Id ?? null,
    spell2Id: selectionOverride.spell2Id ?? localMember?.spell2Id ?? null,
    wardSkinId:
      selectionOverride.wardSkinId ?? (localMember?.wardSkinId && localMember.wardSkinId > 0 ? localMember.wardSkinId : null),
  }

  const countdown = useCountdown(session ? derived.timer : 0)
  const liveTimer = countdown.remaining

  const hasNotifiedCurrentTurn = useRef<string | null>(null)
  const hasNotifiedLowTimer = useRef(false)

  const currentTurnKey = derived.currentAction ? `${derived.currentAction.id}:${derived.currentAction.type}` : null

  useEffect(() => {
    if (!derived.isMyTurn || !currentTurnKey) {
      hasNotifiedCurrentTurn.current = null

      return
    }

    if (hasNotifiedCurrentTurn.current !== currentTurnKey) {
      notify(derived.phase === 'ban' ? 'your-turn-ban' : 'your-turn-pick')
      hasNotifiedCurrentTurn.current = currentTurnKey
    }
  }, [currentTurnKey, derived.isMyTurn, derived.phase])

  useEffect(() => {
    if (!derived.isMyTurn || liveTimer <= 0) {
      hasNotifiedLowTimer.current = false

      return
    }

    if (liveTimer < 10 && !hasNotifiedLowTimer.current) {
      notify('low-timer', { seconds: String(liveTimer) })
      hasNotifiedLowTimer.current = true

      return
    }

    if (liveTimer >= 10) {
      hasNotifiedLowTimer.current = false
    }
  }, [liveTimer, derived.isMyTurn])

  const invalidateSession = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: champSelectSessionDescriptor.queryKey })
  }, [queryClient])

  const runActionPatch = useCallback(
    async (completed: boolean, championId: ChampionIdType | null): Promise<boolean> => {
      if (!transport) {
        return false
      }

      const patch = createChampSelectPatch({ selectedChampion: championId, session }, completed)

      if (!patch) {
        setError(completed ? 'champSelect.errors.selectChampionBeforeLockingIn' : 'champSelect.errors.notYourTurn')

        return false
      }

      setError(null)
      setIsMutating(true)

      try {
        const ok = await patchChampSelectAction(transport, derived.currentAction?.id ?? 0, patch)

        if (!ok) {
          setError('errors.generic')
        }

        invalidateSession()

        return ok
      } catch {
        setError('errors.generic')

        return false
      } finally {
        setIsMutating(false)
      }
    },
    [derived.currentAction, invalidateSession, session, transport],
  )

  const selectChampionForTurn = useCallback(
    async (championId: ChampionIdType): Promise<boolean> => {
      if (!derived.currentAction || !derived.isMyTurn) {
        setError('champSelect.errors.notYourTurn')

        return false
      }

      setPreviewOverride(championId)

      return runActionPatch(false, championId)
    },
    [derived.currentAction, derived.isMyTurn, runActionPatch],
  )

  const lockInChampion = useCallback(async (): Promise<boolean> => {
    return runActionPatch(true, selectedChampion)
  }, [runActionPatch, selectedChampion])

  const banChampion = useCallback(
    async (championId: ChampionIdType): Promise<boolean> => {
      if (!derived.currentAction || !derived.isMyTurn || derived.currentAction.type !== 'ban') {
        setError('champSelect.errors.notYourTurn')

        return false
      }

      setPreviewOverride(championId)

      return runActionPatch(true, championId)
    },
    [derived.currentAction, derived.isMyTurn, runActionPatch],
  )

  const swapBench = useCallback(
    async (championId: ChampionIdType): Promise<boolean> => {
      if (!transport || !derived.benchChampionIds.includes(championId)) {
        setAramError('champSelect.errors.championNotOnBench')

        return false
      }

      setAramError(null)
      setIsMutating(true)

      try {
        const ok = await swapBenchChampion(transport, championId)

        if (!ok) {
          setAramError('errors.generic')
        }

        invalidateSession()

        return ok
      } catch {
        setAramError('errors.generic')

        return false
      } finally {
        setIsMutating(false)
      }
    },
    [derived.benchChampionIds, invalidateSession, transport],
  )

  const changeSkin = useCallback(
    async (skinId: number): Promise<boolean> => {
      if (!transport) {
        return false
      }

      setSelectionOverride((current) => {
        return { ...current, skinId }
      })

      try {
        return await patchMySelection(transport, { selectedSkinId: skinId })
      } catch {
        setSelectionOverride((current) => {
          return { ...current, skinId: undefined }
        })

        setError('errors.generic')

        return false
      }
    },
    [transport],
  )

  const changeSpell = useCallback(
    async (slot: 1 | 2, spellId: SpellId): Promise<boolean> => {
      if (!transport) {
        return false
      }

      const key = slot === 1 ? 'spell1Id' : 'spell2Id'

      setSelectionOverride((current) => {
        return { ...current, [key]: spellId }
      })

      try {
        return await patchMySelection(transport, { [key]: spellId })
      } catch {
        setSelectionOverride((current) => {
          return { ...current, [key]: undefined }
        })

        setError('errors.generic')

        return false
      }
    },
    [transport],
  )

  const changeWardSkin = useCallback(
    async (wardSkinId: number): Promise<boolean> => {
      if (!transport) {
        return false
      }

      setSelectionOverride((current) => {
        return { ...current, wardSkinId }
      })

      try {
        return await patchMySelection(transport, { wardSkinId })
      } catch {
        setSelectionOverride((current) => {
          return { ...current, wardSkinId: undefined }
        })

        setError('errors.generic')

        return false
      }
    },
    [transport],
  )

  const selectedRuneId = useMemo(() => {
    const primaryStyleId = currentRunePageQuery.data?.primaryStyleId

    return typeof primaryStyleId === 'number' ? RuneId(primaryStyleId) : null
  }, [currentRunePageQuery.data])

  const skinsQuery = useChampionSkins(selectedChampion ?? undefined)

  const dataError =
    championsQuery.error || skinsQuery.error || runesQuery.error || spellsQuery.error || sessionQuery.error
      ? 'errors.generic'
      : null

  return {
    actions: derived.actions,
    aram: {
      bench: derived.benchChampionIds,
      cards: subsetListQuery.data ?? [],
      error: aramError,
      isLoading: isMutating || subsetListQuery.isLoading,
      swapBench,
    },
    banChampion,
    bannableChampionIds: bannableChampionIdsQuery.data ?? [],
    bannedChampions: derived.bannedChampions,
    benchChampionIds: derived.benchChampionIds,
    championSkins: skinsQuery.data ?? [],
    champions: championsQuery.data ?? [],
    changeSkin,
    changeSpell,
    changeWardSkin,
    currentAction: derived.currentAction,
    dataError,
    enemyTeam: derived.enemyTeam,
    error,
    isAram: mode === 'aram',
    isArena: mode === 'arena',
    isLoading: sessionQuery.isLoading || championsQuery.isLoading,
    isMyTurn: derived.isMyTurn,
    localPlayerCellId: derived.localPlayerCellId,
    lockInChampion,
    mode,
    ownedSkinIds: pickableSkinIdsQuery.data ?? [],
    phase: derived.phase,
    pickableChampionIds: pickableChampionIdsQuery.data ?? [],
    runeTrees: runesQuery.data ?? [],
    selectChampionForTurn,
    selectedChampion,
    selectedRuneId,
    selection,
    session,
    summonerSpells: spellsQuery.data ?? [],
    team: derived.team,
    timer: liveTimer,
    wardSkins: wardSkinsQuery.data ?? [],
  }
}
