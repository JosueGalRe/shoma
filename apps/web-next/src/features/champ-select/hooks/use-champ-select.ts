import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import {
  useChampionSkins,
  useChampions,
  useRunes,
  type ChampionSkin,
  type RuneTree,
} from '@/core/http/ddragon-client'
import { champSelectSessionDescriptor, createLcuQueryOptions, rerollPointsDescriptor, summonerSpellsDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { useAramStore, type AramStore } from '@/features/champ-select/aram-store'
import {
  useChampSelectStore,
  type ChampSelectActionPatch,
  type ChampSelectStore,
} from '@/features/champ-select/champ-select-store'
import { resolveGameMode, type GameMode } from '@/features/modes/mode-engine'
import { notify } from '@/features/notifications/notification-manager'

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: number
  name: string
}

export type RerollPoints = {
  currentPoints?: number
  maxRolls?: number
  numberOfRolls?: number
  pointsCostToRoll?: number
  pointsToReroll?: number
}

export type UseChampSelectAram = Omit<AramStore, 'reroll' | 'swapBench'> & {
  reroll: () => Promise<boolean>
  swapBench: (championId: number) => Promise<boolean>
}

export type UseChampSelectResult = ChampSelectStore & {
  aram: UseChampSelectAram
  banChampion: (championId: number) => Promise<boolean>
  championSkins: ChampionSkin[]
  dataError: string | null
  isAram: boolean
  isArena: boolean
  isLoading: boolean
  lockInChampion: () => Promise<boolean>
  mode: GameMode
  runeTrees: RuneTree[]
  selectChampionForTurn: (championId: number) => Promise<boolean>
  summonerSpells: SummonerSpell[]
}

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300
}

function normalizeError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

function readRerollCount(points: RerollPoints | null | undefined): number {
  return Math.max(0, points?.numberOfRolls ?? 0)
}

export function useChampSelect(): UseChampSelectResult {
  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(() => ({ code, enabled: shouldConnect && code.length > 0 }), [code, shouldConnect])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)

  const store = useChampSelectStore()
  const setChampions = useChampSelectStore((state) => state.setChampions)
  const aram = useAramStore()
  const storeRef = useRef(store)
  storeRef.current = store
  const aramRef = useRef(aram)
  aramRef.current = aram
  const sessionQuery = useQuery(createLcuQueryOptions(champSelectSessionDescriptor, transport))
  useLcuObserverSync(champSelectSessionDescriptor, transport)
  const spellsQuery = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))
  const rerollQuery = useQuery(createLcuQueryOptions(rerollPointsDescriptor, transport))
  const championsQuery = useChampions()
  const skinsQuery = useChampionSkins(store.selectedChampion ?? undefined)
  const runesQuery = useRunes()
  const hasNotifiedCurrentTurn = useRef<string | null>(null)
  const hasNotifiedLowTimer = useRef(false)

  useEffect(() => {
    setChampions(championsQuery.data ?? [])
  }, [championsQuery.data, setChampions])

  useEffect(() => {
    if (sessionQuery.data) {
      storeRef.current.setSession(sessionQuery.data)
    }
  }, [sessionQuery.data])

  useEffect(() => {
    if (sessionQuery.error) {
      storeRef.current.setError(sessionQuery.error)
    }
  }, [sessionQuery.error])

  useEffect(() => {
    aramRef.current.setAramState({
      bench: storeRef.current.session?.benchChampionIds ?? [],
      canReroll: readRerollCount(rerollQuery.data) > 0,
      hasLoadedRerolls: Boolean(rerollQuery.data || rerollQuery.error),
      rerollCount: readRerollCount(rerollQuery.data),
    })
  }, [rerollQuery.data, rerollQuery.error, store.session?.benchChampionIds])

  useEffect(() => {
    if (!storeRef.current.session || storeRef.current.timer <= 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => storeRef.current.decrementTimer(), 1000)
    return () => window.clearInterval(intervalId)
  }, [store.session, store.timer])

  useEffect(() => {
    const currentAction = store.currentAction
    const turnKey = currentAction ? `${currentAction.id}:${currentAction.type}` : null

    if (store.isMyTurn && turnKey && hasNotifiedCurrentTurn.current !== turnKey) {
      notify(store.phase === 'ban' ? 'your-turn-ban' : 'your-turn-pick')
      hasNotifiedCurrentTurn.current = turnKey
    }

    if (!store.isMyTurn || !turnKey) {
      hasNotifiedCurrentTurn.current = null
    }
  }, [store.currentAction, store.isMyTurn, store.phase])

  useEffect(() => {
    if (!store.isMyTurn || store.timer <= 0) {
      hasNotifiedLowTimer.current = false
      return
    }

    if (store.timer < 10 && !hasNotifiedLowTimer.current) {
      notify('low-timer', { seconds: String(store.timer) })
      hasNotifiedLowTimer.current = true
      return
    }

    if (store.timer >= 10) {
      hasNotifiedLowTimer.current = false
    }
  }, [store.isMyTurn, store.timer])

  const requestAction = useCallback(
    async (patch: ChampSelectActionPatch | null): Promise<boolean> => {
      if (!transport || !store.currentAction || !patch) {
        return false
      }

      try {
        const result = await transport.request(LcuPaths.champSelect.action(store.currentAction.id), LcuHttpMethod.PATCH, patch)
        if (!isSuccessfulStatus(result.status)) {
          throw new Error(`Champ select action failed (${result.status}).`)
        }
        void sessionQuery.refetch()
        return true
      } catch (error) {
        store.setError(normalizeError(error, 'Champ select action failed.'))
        return false
      }
    },
    [sessionQuery, store, transport],
  )

  const selectChampionForTurn = useCallback(
    async (championId: number): Promise<boolean> => requestAction(store.selectChampion(championId)),
    [requestAction, store],
  )

  const lockInChampion = useCallback(async (): Promise<boolean> => requestAction(store.lockIn()), [requestAction, store])

  const banChampion = useCallback(async (championId: number): Promise<boolean> => requestAction(store.ban(championId)), [requestAction, store])

  const mode = resolveGameMode({
    benchEnabled: Boolean(store.session?.benchEnabled || aram.bench.length > 0),
    gameMode: store.session?.gameMode,
    mapId: store.session?.mapId,
    queueId: store.session?.queueId,
  })

  const reroll = useCallback(async (): Promise<boolean> => {
    if (!transport || !aram.reroll()) {
      return false
    }

    aram.setLoading(true)
    try {
      const result = await transport.request(LcuPaths.champSelect.mySelectionReroll, LcuHttpMethod.POST)
      if (!isSuccessfulStatus(result.status)) {
        throw new Error(`Reroll failed (${result.status}).`)
      }
      void sessionQuery.refetch()
      void rerollQuery.refetch()
      aram.setLoading(false)
      return true
    } catch (error) {
      aram.setError(normalizeError(error, 'Reroll failed.'))
      return false
    }
  }, [aram, rerollQuery, sessionQuery, transport])

  const swapBench = useCallback(
    async (championId: number): Promise<boolean> => {
      if (!transport || !aram.swapBench(championId)) {
        return false
      }

      aram.setLoading(true)
      try {
        const result = await transport.request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)
        if (!isSuccessfulStatus(result.status)) {
          throw new Error(`Bench swap failed (${result.status}).`)
        }
        void sessionQuery.refetch()
        aram.completeBenchSwap(championId)
        aram.setLoading(false)
        return true
      } catch (error) {
        aram.setError(normalizeError(error, 'Bench swap failed.'))
        return false
      }
    },
    [aram, sessionQuery, transport],
  )

  return {
    ...store,
    aram: { ...aram, reroll, swapBench },
    banChampion,
    championSkins: skinsQuery.data ?? [],
    dataError: championsQuery.error ?? skinsQuery.error ?? runesQuery.error ?? spellsQuery.error ?? rerollQuery.error ? 'errors.generic' : null,
    isAram: mode === 'aram',
    isArena: mode === 'arena',
    isLoading: sessionQuery.isLoading || championsQuery.isLoading,
    lockInChampion,
    mode,
    runeTrees: runesQuery.data ?? [],
    selectChampionForTurn,
    summonerSpells: spellsQuery.data ?? [],
  }
}
