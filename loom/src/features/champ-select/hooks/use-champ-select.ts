import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { type ChampionSummary, useChampions } from '@/core/http/ddragon'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  accountLoadoutDescriptor,
  bannableChampionIdsDescriptor,
  champSelectSessionDescriptor,
  createLcuQueryOptions,
  gameQueuesDescriptor,
  pickableChampionIdsDescriptor,
  subsetChampionListDescriptor,
  type SummonerSpell,
  summonerSpellsDescriptor,
  wardSkinsDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import {
  type ChampSelectAction,
  type ChampSelectMember,
  type ChampSelectPhase,
  type ChampSelectSession,
  createChampSelectPatch,
  deriveChampSelectState,
  readPatchTarget,
} from '@/features/champ-select/champ-select-actions'
import {
  type ChampionSwapCall,
  type MySelectionPatch,
  patchChampSelectAction,
  patchMySelection,
  patchWardSkin,
  postChampionSwap,
  swapBenchChampion,
} from '@/features/champ-select/champ-select-mutations'
import { type GameMode, resolveGameMode } from '@/features/modes/mode-engine'
import { MULTITEAM_LOBBY_CONFIG } from '@/features/modes/multiteam-lobby'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/use-countdown'

import type { ChampSelectTrade, WardSkin } from '@/core/lcu/parsers/champ-select'
import type { CellId, ChampionId as ChampionIdType, SpellId } from '@/core/types/branded'

export interface ChampSelectAramState {
  bench: ChampionIdType[]
  cards: ChampionIdType[]
  error: string | null
  isLoading: boolean
  // A card picks and locks its champion at once, as the client's does
  pickCard: (championId: ChampionIdType) => Promise<boolean>
  swapBench: (championId: ChampionIdType) => Promise<boolean>
}

export interface ChampSelectSelectionState {
  championId: ChampionIdType | null
  skinId: number | null
  spell1Id: SpellId | null
  spell2Id: SpellId | null
  wardSkinId: number | null
}

export type ChampSelectSelectionPatch = MySelectionPatch & { wardSkinId?: number }

export interface UseChampSelectResult {
  actions: ChampSelectAction[][]
  aram: ChampSelectAramState
  banChampion: (championId: ChampionIdType) => Promise<boolean>
  bannableChampionIds: ChampionIdType[]
  bannedChampions: ChampionIdType[]
  benchChampionIds: ChampionIdType[]
  champions: ChampionSummary[]
  // Skin, spells and ward, shown at once and taken back if the client refuses them
  changeSelection: (patch: ChampSelectSelectionPatch) => Promise<boolean>
  currentAction: ChampSelectAction | null
  dataError: string | null
  enemyTeam: ChampSelectMember[]
  error: string | null
  // The LCU's game mode (CLASSIC, ARAM, CHERRY…), from the queue since the session has none
  gameMode: string
  isAram: boolean
  isArena: boolean
  isLoading: boolean
  isMyTurn: boolean
  localPlayerCellId: CellId | null
  lockInChampion: () => Promise<boolean>
  mode: GameMode
  phase: ChampSelectPhase
  pickableChampionIds: ChampionIdType[]
  selectChampionForTurn: (championId: ChampionIdType) => Promise<boolean>
  selectedChampion: ChampionIdType | null
  selection: ChampSelectSelectionState
  session: ChampSelectSession | null
  // Arena's players a team, 0 for two-team modes: the client's team is the local player's, the rest are rivals
  subteamSize: number
  summonerSpells: SummonerSpell[]
  swapChampion: (tradeId: number, call: ChampionSwapCall) => Promise<boolean>
  team: ChampSelectMember[]
  timer: number
  // The champion trades with each ally, while picks and finalization run
  trades: ChampSelectTrade[]
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
  const pickableChampionIdsQuery = useQuery(createLcuQueryOptions(pickableChampionIdsDescriptor, transport))
  const bannableChampionIdsQuery = useQuery(createLcuQueryOptions(bannableChampionIdsDescriptor, transport))
  const championsQuery = useChampions()
  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))

  useLcuObserverSync(champSelectSessionDescriptor, transport)
  useLcuObserverSync(subsetChampionListDescriptor, transport)
  // Arena de Valentía deals its champions as champ select starts, by changing this list
  useLcuObserverSync(pickableChampionIdsDescriptor, transport)

  const session = sessionQuery.data ?? null
  const queueId = session?.queueId
  // The session carries no game mode, and Arena's variants come with new queue ids: the queue's own says CHERRY
  const queueGameMode = queuesQuery.data?.find(({ id }) => {
    return id === queueId
  })?.gameMode
  const mode = resolveGameMode({
    benchEnabled: session?.benchEnabled ?? (session?.benchChampions?.length ?? 0) > 0,
    gameMode: session?.gameMode ?? queueGameMode,
    mapId: session?.mapId,
    queueId,
  })
  // The client's teams of 2, or of 3 in the queues it lists, which match its multiteam lobby's table
  const subteamSize = mode === 'arena' ? (MULTITEAM_LOBBY_CONFIG[queueId ?? 0]?.playerSlotCount ?? 2) : 0
  // Memoized so React Compiler sees it frozen: reading it further down keeps the hook's memoization
  const derived = useMemo(() => {
    return deriveChampSelectState(session, subteamSize)
  }, [session, subteamSize])

  const localMember = derived.team.find((member) => {
    return member.cellId === derived.localPlayerCellId
  })

  const localSummonerId = localMember?.summonerId ?? 0
  const wardSkinsQuery = useQuery({
    ...createLcuQueryOptions(wardSkinsDescriptor(localSummonerId), transport),
    enabled: Boolean(transport) && localSummonerId > 0,
  })
  const loadoutQuery = useQuery(createLcuQueryOptions(accountLoadoutDescriptor, transport))
  const loadoutId = loadoutQuery.data?.id

  // Local overrides: instant feedback for selections that the session confirms later.
  const [previewOverride, setPreviewOverride] = useState<ChampionIdType | null>(null)
  const [selectionOverride, setSelectionOverride] = useState<SelectionOverride>({})
  const [error, setError] = useState<string | null>(null)
  const [aramError, setAramError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const currentActionId = derived.currentAction?.id ?? null
  const [previewActionId, setPreviewActionId] = useState(currentActionId)

  // A hover belongs to its action: the champion banned a turn ago is no pick
  if (previewActionId !== currentActionId) {
    setPreviewActionId(currentActionId)
    setPreviewOverride(null)
  }

  // Champ select ended: the next one starts without this one's overrides
  if (!session && (previewOverride !== null || Object.keys(selectionOverride).length > 0)) {
    setPreviewOverride(null)
    setSelectionOverride({})
  }

  // A ban starts empty: the champion the player declared is no ban
  const sessionSelectedChampion =
    derived.currentAction?.type === 'ban'
      ? derived.currentAction.championId || null
      : derived.currentAction?.championId || localMember?.championPickIntent || localMember?.championId || null
  const hoveredChampion = (previewOverride ?? sessionSelectedChampion) || null
  // A champion banned meanwhile is no choice anymore
  const selectedChampion =
    hoveredChampion !== null && derived.bannedChampions.includes(hoveredChampion) ? null : hoveredChampion

  const selection: ChampSelectSelectionState = {
    championId: selectedChampion,
    skinId: selectionOverride.skinId ?? localMember?.selectedSkinId ?? null,
    spell1Id: selectionOverride.spell1Id ?? localMember?.spell1Id ?? null,
    spell2Id: selectionOverride.spell2Id ?? localMember?.spell2Id ?? null,
    wardSkinId: selectionOverride.wardSkinId ?? loadoutQuery.data?.wardSkinId ?? wardSkinsQuery.data?.[0]?.id ?? null,
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
        const ok = await patchChampSelectAction(transport, readPatchTarget(session, completed)?.id ?? 0, patch)

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
    [invalidateSession, session, transport],
  )

  const selectChampionForTurn = useCallback(
    async (championId: ChampionIdType): Promise<boolean> => {
      // Outside the local turn the hover goes to the pending pick, which declares the intent
      if (!derived.isMyTurn && !derived.intentAction) {
        setError('champSelect.errors.notYourTurn')

        return false
      }

      setPreviewOverride(championId)

      return runActionPatch(false, championId)
    },
    [derived.intentAction, derived.isMyTurn, runActionPatch],
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

  const pickCard = useCallback(
    async (championId: ChampionIdType): Promise<boolean> => {
      return runActionPatch(true, championId)
    },
    [runActionPatch],
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

  const changeSelection = useCallback(
    async (patch: ChampSelectSelectionPatch): Promise<boolean> => {
      if (!transport) {
        return false
      }

      const { wardSkinId, ...mySelection } = patch

      async function saveWardSkin(id: number | undefined) {
        if (id === undefined) {
          return true
        }

        if (!transport || !loadoutId || !(await patchWardSkin(transport, loadoutId, id))) {
          return false
        }

        void queryClient.invalidateQueries({ queryKey: accountLoadoutDescriptor.queryKey })

        return true
      }

      const override: SelectionOverride = {
        skinId: patch.selectedSkinId,
        spell1Id: patch.spell1Id,
        spell2Id: patch.spell2Id,
        wardSkinId: patch.wardSkinId,
      }
      const changed = Object.fromEntries(
        Object.entries(override).filter(([, value]) => {
          return value !== undefined
        }),
      )

      function takeBack() {
        setSelectionOverride((current) => {
          return Object.fromEntries(
            Object.entries(current).filter(([key]) => {
              return !(key in changed)
            }),
          )
        })

        setError('errors.generic')
      }

      setSelectionOverride((current) => {
        return { ...current, ...changed }
      })

      try {
        const results = await Promise.all([
          Object.keys(mySelection).length > 0 ? patchMySelection(transport, mySelection) : true,
          saveWardSkin(wardSkinId),
        ])
        const ok = results.every(Boolean)

        if (!ok) {
          takeBack()
        }

        return ok
      } catch {
        takeBack()

        return false
      }
    },
    [loadoutId, queryClient, transport],
  )

  const swapChampion = useCallback(
    async (tradeId: number, call: ChampionSwapCall): Promise<boolean> => {
      if (!transport) {
        return false
      }

      try {
        const ok = await postChampionSwap(transport, tradeId, call)

        invalidateSession()

        return ok
      } catch {
        return false
      }
    },
    [invalidateSession, transport],
  )

  const dataError = championsQuery.error || spellsQuery.error || sessionQuery.error ? 'errors.generic' : null

  return {
    actions: derived.actions,
    aram: {
      bench: derived.benchChampionIds,
      cards: subsetListQuery.data ?? [],
      error: aramError,
      isLoading: isMutating || subsetListQuery.isLoading,
      pickCard,
      swapBench,
    },
    banChampion,
    bannableChampionIds: bannableChampionIdsQuery.data ?? [],
    bannedChampions: derived.bannedChampions,
    benchChampionIds: derived.benchChampionIds,
    champions: championsQuery.data ?? [],
    changeSelection,
    currentAction: derived.currentAction,
    dataError,
    enemyTeam: derived.enemyTeam,
    error,
    gameMode: session?.gameMode ?? queueGameMode ?? 'CLASSIC',
    isAram: mode === 'aram',
    isArena: mode === 'arena',
    isLoading: sessionQuery.isLoading || championsQuery.isLoading,
    isMyTurn: derived.isMyTurn,
    localPlayerCellId: derived.localPlayerCellId,
    lockInChampion,
    mode,
    phase: derived.phase,
    pickableChampionIds: pickableChampionIdsQuery.data ?? [],
    selectChampionForTurn,
    selectedChampion,
    selection,
    session,
    subteamSize,
    summonerSpells: spellsQuery.data ?? [],
    swapChampion,
    team: derived.team,
    timer: liveTimer,
    trades: sessionQuery.data?.trades ?? [],
    wardSkins: wardSkinsQuery.data ?? [],
  }
}
