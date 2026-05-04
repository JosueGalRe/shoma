import { useCallback, useEffect, useMemo } from 'react'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import {
  useChampionSkins,
  useChampions,
  useRunes,
  type ChampionSkin,
  type RuneTree,
} from '@/core/http/ddragon-client'
import { useLCUObserver, useLCURequest, useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { useAramStore, type AramStore } from '@/features/champ-select/aram-store'
import {
  useChampSelectStore,
  type ChampSelectActionPatch,
  type ChampSelectSession,
  type ChampSelectStore,
} from '@/features/champ-select/champ-select-store'

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
  dataError: Error | null
  isAram: boolean
  isLoading: boolean
  lockInChampion: () => Promise<boolean>
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

function readRerollCount(points: RerollPoints | null): number {
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
  const observedSession = useLCUObserver<ChampSelectSession>(transport, LcuPaths.champSelect.session)
  const sessionRequest = useLCURequest<ChampSelectSession>(transport, LcuPaths.champSelect.session, LcuHttpMethod.GET)
  const spellsRequest = useLCURequest<SummonerSpell[]>(transport, LcuPaths.assetServing.summonerSpells, LcuHttpMethod.GET)
  const rerollRequest = useLCURequest<RerollPoints>(transport, LcuPaths.summoner.currentSummonerRerollPoints, LcuHttpMethod.GET)
  const championsQuery = useChampions()
  const skinsQuery = useChampionSkins(store.selectedChampion ?? undefined)
  const runesQuery = useRunes()

  useEffect(() => {
    setChampions(championsQuery.data ?? [])
  }, [championsQuery.data, setChampions])

  useEffect(() => {
    if (sessionRequest.data) {
      store.setSession(sessionRequest.data)
    }
  }, [sessionRequest.data, store.setSession])

  useEffect(() => {
    if (observedSession.data) {
      store.setSession(observedSession.data.content)
    }
  }, [observedSession.data, store.setSession])

  useEffect(() => {
    if (observedSession.error) {
      store.setError(observedSession.error)
    }
  }, [observedSession.error, store.setError])

  useEffect(() => {
    aram.setAramState({
      bench: store.session?.benchChampionIds ?? [],
      canReroll: readRerollCount(rerollRequest.data) > 0,
      rerollCount: readRerollCount(rerollRequest.data),
    })
  }, [aram.setAramState, rerollRequest.data, store.session?.benchChampionIds])

  useEffect(() => {
    if (!store.session || store.timer <= 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => store.decrementTimer(), 1000)
    return () => window.clearInterval(intervalId)
  }, [store.decrementTimer, store.session, store.timer])

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
        sessionRequest.refetch()
        return true
      } catch (error) {
        store.setError(normalizeError(error, 'Champ select action failed.'))
        return false
      }
    },
    [sessionRequest, store, transport],
  )

  const selectChampionForTurn = useCallback(
    async (championId: number): Promise<boolean> => requestAction(store.selectChampion(championId)),
    [requestAction, store],
  )

  const lockInChampion = useCallback(async (): Promise<boolean> => requestAction(store.lockIn()), [requestAction, store])

  const banChampion = useCallback(async (championId: number): Promise<boolean> => requestAction(store.ban(championId)), [requestAction, store])

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
      sessionRequest.refetch()
      rerollRequest.refetch()
      aram.setLoading(false)
      return true
    } catch (error) {
      aram.setError(normalizeError(error, 'Reroll failed.'))
      return false
    }
  }, [aram, rerollRequest, sessionRequest, transport])

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
        sessionRequest.refetch()
        aram.setLoading(false)
        return true
      } catch (error) {
        aram.setError(normalizeError(error, 'Bench swap failed.'))
        return false
      }
    },
    [aram, sessionRequest, transport],
  )

  return {
    ...store,
    aram: { ...aram, reroll, swapBench },
    banChampion,
    championSkins: skinsQuery.data ?? [],
    dataError: championsQuery.error ?? skinsQuery.error ?? runesQuery.error ?? spellsRequest.error ?? rerollRequest.error,
    isAram: Boolean(store.session?.benchEnabled || aram.bench.length > 0),
    isLoading: observedSession.isLoading || sessionRequest.isLoading || championsQuery.isLoading,
    lockInChampion,
    runeTrees: runesQuery.data ?? [],
    selectChampionForTurn,
    summonerSpells: spellsRequest.data ?? [],
  }
}
