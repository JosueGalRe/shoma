import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChampSelectCard } from '@/routes/connected/lobby/-components/ChampSelectCard'
import { SpellsCard } from '@/routes/connected/lobby/-components/SpellsCard'
import { SkinsCard } from '@/routes/connected/lobby/-components/SkinsCard'
import { RunesTab } from './-components/RunesTab'
import { ChampSelectTabs } from './-components/ChampSelectTabs'
import { ChampionsTab } from './-components/ChampionsTab'
import { useLobbyRuntimeResources } from '@/routes/connected/lobby/-hooks/lobby-runtime-resources'
import { useLobbyRuneActions } from '@/routes/connected/lobby/-hooks/lobby-rune-actions'
import { useConnectedUiStore } from '@/routes/connected/lobby/-lobby-store'
import {
  parseRunePages,
  parseRuneStyles,
  readActiveRunePage,
  readEditableActiveRunePage,
  readRuneStyleById,
  readSelectedSecondaryRuneIds,
  type ConnectedRunePage,
} from '@/routes/connected/lobby/-lobby-runes'
import { RiftClientState } from '@core/rift/rift-client-types'
import { useRiftStore } from '@core/rift/rift-store'

export const Route = createFileRoute('/connected/champ-select')({
  component: ConnectedChampSelectRoute,
})

function ConnectedChampSelectRoute() {
  const queryClient = useQueryClient()
  const { i18n, t } = useTranslation()
  const { status, client, champSelectState, setPeer, appendLog } = useRiftStore()
  const [activeTab, setActiveTab] = useState('champions')

  const {
    setChampionActionPending,
    championSelectionDraft,
    setChampionSelectionDraft,
    rerollPending,
    setRerollPending,
    benchSwapPendingId,
    setBenchSwapPendingId,
    spellUpdatePending,
    setSpellUpdatePending,
    skinUpdatePending,
    setSkinUpdatePending,
    runeUpdatePending,
    setRuneUpdatePending,
    runePageActionPending,
    setRunePageActionPending,
    runeEditPending,
    setRuneEditPending,
    secondaryRuneSelectionIndex,
    setSecondaryRuneSelectionIndex,
    selectedSpell1Draft,
    setSelectedSpell1Draft,
    selectedSpell2Draft,
    setSelectedSpell2Draft,
    selectedSkinDraft,
    setSelectedSkinDraft,
    runePageNameDraft,
    setRunePageNameDraft,
  } = useConnectedUiStore()
  const previousChampSelectActionIdRef = useRef<number | null>(null)
  const { ddragonVersionValue, championNamesById, championMetadataById, lcuClient } = useLobbyRuntimeResources({
    i18nResolvedLanguage: i18n.resolvedLanguage,
    queueErrors: undefined,
    appendLog,
    client,
    setPeer,
    status,
  })

  const { data: selectableChampionIds = [] } = useQuery({
    queryKey: ['champ-select-selectable', champSelectState?.currentActionType, Object.keys(championNamesById).length] as const,
    queryFn: async () => {
      const actionType = champSelectState?.currentActionType
      if (!actionType) {
        return []
      }

      try {
        const response = await lcuClient.champSelect.getSelectableChampionIds(actionType)
        if (response.status !== 200 || !Array.isArray(response.content)) {
          appendLog(`champ selectable status: ${response.status}`)
          return []
        }

        const available = response.content.filter((value): value is number => typeof value === 'number')
        const fallbackAvailable = Object.keys(championNamesById)
          .map(Number)
          .filter((value) => Number.isFinite(value))
        const selectable = available.length > 0 ? available : fallbackAvailable

        appendLog(`champ selectable status: ${response.status}, count: ${available.length}, fallback: ${fallbackAvailable.length}`)

        if (actionType !== 'ban') {
          return selectable
        }

        return selectable.filter((championId) => !champSelectState?.bannedChampionIds.includes(championId))
      } catch (error) {
        appendLog(`champ selectable load failed: ${String(error)}`)
        return []
      }
    },
    enabled:
      status === RiftClientState.CONNECTED &&
      Boolean(champSelectState && (champSelectState.currentActionId !== null || champSelectState.hoverActionId !== null)),
    staleTime: 10_000,
  })

  const fallbackChampionIds = useMemo(() => {
    return Object.keys(championNamesById)
      .map(Number)
      .filter((value) => Number.isFinite(value))
  }, [championNamesById])

  const visibleSelectableChampionIds = useMemo(() => {
    const source = selectableChampionIds.length > 0 ? selectableChampionIds : fallbackChampionIds
    if (champSelectState?.currentActionType !== 'ban') {
      return source
    }

    return source.filter((championId) => !champSelectState.bannedChampionIds.includes(championId))
  }, [champSelectState?.bannedChampionIds, champSelectState?.currentActionType, fallbackChampionIds, selectableChampionIds])

  const { data: rerollPoints } = useQuery({
    queryKey: ['champ-select-reroll-points'] as const,
    queryFn: async () => {
      try {
        const response = await lcuClient.summoner.getCurrentSummonerRerollPoints()
        if (response.status !== 200 || typeof response.content !== 'object' || response.content === null) {
          return null
        }

        const content = response.content as {
          currentPoints?: unknown
          maxRolls?: unknown
          numberOfRolls?: unknown
          pointsCostToRoll?: unknown
        }

        return {
          currentPoints: typeof content.currentPoints === 'number' ? content.currentPoints : 0,
          maxRolls: typeof content.maxRolls === 'number' ? content.maxRolls : 0,
          numberOfRolls: typeof content.numberOfRolls === 'number' ? content.numberOfRolls : 0,
          pointsCostToRoll: typeof content.pointsCostToRoll === 'number' ? content.pointsCostToRoll : 0,
        }
      } catch (error) {
        appendLog(`reroll points load failed: ${String(error)}`)
        return null
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState),
    staleTime: 10_000,
    refetchInterval: 10_000,
  })

  const { data: gameflowMode = 'CLASSIC' } = useQuery({
    queryKey: ['gameflow-mode'] as const,
    queryFn: async () => {
      try {
        const response = await lcuClient.gameflow.getSession()
        if (response.status !== 200 || typeof response.content !== 'object' || response.content === null) {
          return 'CLASSIC'
        }

        const candidate = response.content as {
          gameData?: {
            queue?: {
              gameMode?: unknown
            }
          }
        }

        return typeof candidate.gameData?.queue?.gameMode === 'string' ? candidate.gameData.queue.gameMode : 'CLASSIC'
      } catch (error) {
        appendLog(`gameflow mode load failed: ${String(error)}`)
        return 'CLASSIC'
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState),
    staleTime: 30_000,
  })

  const { data: summonerSpellMetadata = [] } = useQuery({
    queryKey: ['summoner-spell-metadata'] as const,
    queryFn: async () => {
      try {
        const response = await lcuClient.assets.getSummonerSpells()
        if (response.status !== 200 || !Array.isArray(response.content)) {
          return []
        }

        return response.content
          .map((value) => {
            if (typeof value !== 'object' || value === null) {
              return null
            }

            const candidate = value as {
              id?: unknown
              summonerSpellId?: unknown
              spellKey?: unknown
              gameModes?: unknown
            }
            const id =
              typeof candidate.id === 'number'
                ? candidate.id
                : typeof candidate.summonerSpellId === 'number'
                  ? candidate.summonerSpellId
                  : typeof candidate.spellKey === 'number'
                    ? candidate.spellKey
                    : typeof candidate.id === 'string' && Number.isFinite(Number(candidate.id))
                      ? Number(candidate.id)
                      : null

            if (id === null || !Array.isArray(candidate.gameModes)) {
              return null
            }

            const gameModes = candidate.gameModes.filter((mode): mode is string => typeof mode === 'string')
            return { id, gameModes }
          })
          .filter((value) => value !== null)
      } catch (error) {
        appendLog(`summoner spell metadata load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState),
    staleTime: 60_000,
  })

  const availableSpellIds = useMemo(() => {
    const spellsForMode = summonerSpellMetadata
      .filter((entry) => entry.gameModes.includes(gameflowMode))
      .map((entry) => entry.id)

    if (spellsForMode.length > 0) {
      return spellsForMode
    }

    return summonerSpellMetadata.map((entry) => entry.id)
  }, [gameflowMode, summonerSpellMetadata])

  const { data: runeStyles = [] } = useQuery({
    queryKey: ['rune-styles'] as const,
    queryFn: async () => {
      try {
        const response = await lcuClient.perks.getStyles()
        if (response.status !== 200 || !Array.isArray(response.content)) {
          return []
        }

        return parseRuneStyles(response.content)
      } catch (error) {
        appendLog(`rune styles load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState),
    staleTime: 60_000,
  })

  const { data: runePages = [] } = useQuery<ConnectedRunePage[]>({
    queryKey: ['rune-pages'] as const,
    queryFn: async () => {
      try {
        const response = await lcuClient.perks.getPages()
        if (response.status !== 200) {
          return []
        }

        const parsedPages = parseRunePages(response.content)
        if (parsedPages.length > 0) {
          return parsedPages
        }

        const currentPageResponse = await lcuClient.perks.getCurrentPage()
        if (currentPageResponse.status !== 200) {
          return []
        }

        return parseRunePages([currentPageResponse.content])
      } catch (error) {
        appendLog(`rune pages load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState),
    staleTime: 10_000,
  })

  const activeRunePage = useMemo(() => readActiveRunePage(runePages), [runePages])
  const editableActiveRunePage = useMemo(() => readEditableActiveRunePage(activeRunePage), [activeRunePage])
  const primaryRuneStyle = useMemo(() => readRuneStyleById(runeStyles, editableActiveRunePage?.primaryStyleId ?? null), [editableActiveRunePage?.primaryStyleId, runeStyles])
  const secondaryRuneStyle = useMemo(() => readRuneStyleById(runeStyles, editableActiveRunePage?.secondaryStyleId ?? null), [editableActiveRunePage?.secondaryStyleId, runeStyles])
  const selectedSecondaryRuneIds = useMemo(() => readSelectedSecondaryRuneIds(editableActiveRunePage), [editableActiveRunePage])

  const {
    selectPrimaryRuneStyle,
    selectPrimaryRune,
    selectSecondaryRuneStyle,
    selectSecondaryRune,
    selectStatShard,
    createRunePage,
    renameActiveRunePage,
    deleteActiveRunePage,
    selectRunePage,
  } = useLobbyRuneActions({
    status,
    lcuClient,
    queryClient,
    appendLog,
    runeEditPending,
    setRuneEditPending,
    runePageActionPending,
    setRunePageActionPending,
    runeUpdatePending,
    setRuneUpdatePending,
    secondaryRuneSelectionIndex,
    setSecondaryRuneSelectionIndex,
    editableActiveRunePage,
    activeRunePage,
    runeStyles,
    runePages,
    runePageNameDraft,
    buildNewRunePageName(nextIndex) {
      return t(($) => $.connected.champSelectRunesNewName, { value: String(nextIndex) })
    },
    buildDeleteConfirmMessage(name) {
      return t(($) => $.connected.champSelectRunesDeleteConfirm, { value: name })
    },
    confirm(message) {
      return window.confirm(message)
    },
  })

  const { data: availableSkins = [] } = useQuery({
    queryKey: ['champ-select-skins', champSelectState?.localSummonerId] as const,
    queryFn: async () => {
      const summonerId = champSelectState?.localSummonerId
      if (!summonerId) {
        return []
      }

      try {
        const response = await lcuClient.champions.getInventorySkinsMinimal(summonerId)
        if (response.status !== 200 || !Array.isArray(response.content)) {
          return []
        }

        return response.content
          .map((value) => {
            if (typeof value !== 'object' || value === null) {
              return null
            }

            const candidate = value as {
              id?: unknown
              championId?: unknown
              name?: unknown
              ownership?: { owned?: unknown }
            }

            if (typeof candidate.id !== 'number' || typeof candidate.championId !== 'number') {
              return null
            }

            return {
              id: candidate.id,
              championId: candidate.championId,
              name: typeof candidate.name === 'string' ? candidate.name : `Skin ${candidate.id}`,
              owned: candidate.ownership?.owned === true,
            }
          })
          .filter((value) => value !== null)
      } catch (error) {
        appendLog(`skin inventory load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState?.localSummonerId),
    staleTime: 30_000,
  })

  const skinsForCurrentChampion = useMemo(() => {
    const currentChampionId =
      champSelectState?.currentActionChampionId ?? champSelectState?.localPlayerChampionId ?? champSelectState?.localChampionPickIntentId
    if (!currentChampionId) {
      return []
    }

    return availableSkins.filter((skin) => skin.championId === currentChampionId)
  }, [
    availableSkins,
    champSelectState?.currentActionChampionId,
    champSelectState?.localChampionPickIntentId,
    champSelectState?.localPlayerChampionId,
  ])

  useEffect(() => {
    const activeSelectionActionId = champSelectState?.currentActionId ?? champSelectState?.hoverActionId ?? null
    if (previousChampSelectActionIdRef.current !== activeSelectionActionId) {
      previousChampSelectActionIdRef.current = activeSelectionActionId
      setChampionActionPending(false)

      if (activeSelectionActionId === null) {
        setChampionSelectionDraft('')
        return
      }

      if (champSelectState?.currentActionChampionId && champSelectState.currentActionChampionId > 0) {
        setChampionSelectionDraft(String(champSelectState.currentActionChampionId))
        return
      }

      if (visibleSelectableChampionIds.length > 0) {
        setChampionSelectionDraft(String(visibleSelectableChampionIds[0]))
      }

      return
    }

    if (visibleSelectableChampionIds.length === 0) {
      return
    }

    if (championSelectionDraft && visibleSelectableChampionIds.includes(Number(championSelectionDraft))) {
      return
    }

    setChampionSelectionDraft(String(visibleSelectableChampionIds[0]))
  }, [
    championSelectionDraft,
    champSelectState?.currentActionChampionId,
    champSelectState?.currentActionId,
    champSelectState?.hoverActionId,
    setChampionActionPending,
    setChampionSelectionDraft,
    visibleSelectableChampionIds,
  ])

  useEffect(() => {
    if (typeof champSelectState?.localSpell1Id !== 'number' || typeof champSelectState?.localSpell2Id !== 'number') {
      return
    }

    setSelectedSpell1Draft(String(champSelectState.localSpell1Id))
    setSelectedSpell2Draft(String(champSelectState.localSpell2Id))
  }, [champSelectState?.localSpell1Id, champSelectState?.localSpell2Id, setSelectedSpell1Draft, setSelectedSpell2Draft])

  useEffect(() => {
    if (typeof champSelectState?.localSelectedSkinId !== 'number') {
      return
    }

    setSelectedSkinDraft(String(champSelectState.localSelectedSkinId))
  }, [champSelectState?.localSelectedSkinId, setSelectedSkinDraft])

  useEffect(() => {
    if (skinsForCurrentChampion.length === 0) {
      return
    }

    const currentSelectedSkinId = Number(selectedSkinDraft)
    const hasSelectedSkin = skinsForCurrentChampion.some((skin) => skin.id === currentSelectedSkinId && skin.owned)
    if (hasSelectedSkin) {
      return
    }

    const localSelectedSkin = skinsForCurrentChampion.find((skin) => skin.id === champSelectState?.localSelectedSkinId && skin.owned)
    const fallbackSkin = localSelectedSkin ?? skinsForCurrentChampion.find((skin) => skin.owned)
    if (!fallbackSkin) {
      return
    }

    setSelectedSkinDraft(String(fallbackSkin.id))
  }, [champSelectState?.localSelectedSkinId, selectedSkinDraft, setSelectedSkinDraft, skinsForCurrentChampion])

  useEffect(() => {
    if (!activeRunePage) {
      setRunePageNameDraft('')
      return
    }

    setRunePageNameDraft(activeRunePage.name)
  }, [activeRunePage, setRunePageNameDraft])

  useEffect(() => {
    setSecondaryRuneSelectionIndex(0)
  }, [editableActiveRunePage?.id, setSecondaryRuneSelectionIndex])

  async function updateSummonerSpells(spell1Id: number, spell2Id: number) {
    if (spell1Id === champSelectState?.localSpell1Id && spell2Id === champSelectState.localSpell2Id) {
      return
    }

    if (!Number.isFinite(spell1Id) || !Number.isFinite(spell2Id) || spellUpdatePending || status !== RiftClientState.CONNECTED) {
      return
    }

    setSpellUpdatePending(true)
    try {
      const response = await lcuClient.champSelect.patchMySelection({ spell1Id, spell2Id })
      appendLog(`spell update status: ${response.status}`)
    } catch (error) {
      appendLog(`spell update failed: ${String(error)}`)
    } finally {
      setSpellUpdatePending(false)
    }
  }

  async function selectSummonerSpell(slot: 1 | 2, value: string) {
    const selectedSpellId = Number(value)
    const currentSpell1Id = Number(selectedSpell1Draft)
    const currentSpell2Id = Number(selectedSpell2Draft)
    if (!Number.isFinite(selectedSpellId) || !Number.isFinite(currentSpell1Id) || !Number.isFinite(currentSpell2Id)) {
      return
    }

    let nextSpell1Id = currentSpell1Id
    let nextSpell2Id = currentSpell2Id
    if (slot === 1 && selectedSpellId === currentSpell2Id) {
      nextSpell1Id = selectedSpellId
      nextSpell2Id = currentSpell1Id
    } else if (slot === 2 && selectedSpellId === currentSpell1Id) {
      nextSpell1Id = currentSpell2Id
      nextSpell2Id = selectedSpellId
    } else if (slot === 1) {
      nextSpell1Id = selectedSpellId
    } else {
      nextSpell2Id = selectedSpellId
    }

    setSelectedSpell1Draft(String(nextSpell1Id))
    setSelectedSpell2Draft(String(nextSpell2Id))
    await updateSummonerSpells(nextSpell1Id, nextSpell2Id)
  }

  async function selectSkin(value: string) {
    const selectedSkinId = Number(value)
    if (
      !Number.isFinite(selectedSkinId) ||
      selectedSkinId <= 0 ||
      selectedSkinId === champSelectState?.localSelectedSkinId ||
      skinUpdatePending ||
      status !== RiftClientState.CONNECTED
    ) {
      return
    }

    setSkinUpdatePending(true)
    try {
      const response = await lcuClient.champSelect.patchMySelection({ selectedSkinId })
      appendLog(`skin update status: ${response.status}`)
    } catch (error) {
      appendLog(`skin update failed: ${String(error)}`)
    } finally {
      setSkinUpdatePending(false)
    }
  }

  async function patchChampSelectSelection(championId: number) {
    const actionId = champSelectState?.currentActionId ?? champSelectState?.hoverActionId ?? null
    if (!champSelectState || actionId === null || status !== RiftClientState.CONNECTED) {
      appendLog('champ action skipped: no active champ-select action')
      return
    }

    const selectedChampionId = champSelectState.currentActionId !== null
      ? champSelectState.currentActionChampionId
      : champSelectState.hoverActionChampionId

    if (selectedChampionId === championId) {
      return
    }

    setChampionActionPending(true)
    try {
      const selectionResponse = await lcuClient.champSelect.patchAction(actionId, { championId })
      appendLog(`champ action selection status: ${selectionResponse.status}`)
    } catch (error) {
      appendLog(`champ action failed: ${String(error)}`)
    } finally {
      setChampionActionPending(false)
    }
  }

  async function completeCurrentChampSelectAction() {
    const championId = Number(championSelectionDraft)
    if (!Number.isFinite(championId) || championId <= 0) {
      appendLog(`champ action skipped: invalid champion draft ${championSelectionDraft}`)
      return
    }

    const actionId = champSelectState?.currentActionId ?? champSelectState?.hoverActionId ?? null
    if (!champSelectState || actionId === null || status !== RiftClientState.CONNECTED) {
      appendLog('champ action skipped: no current champ-select action')
      return
    }

    setChampionActionPending(true)
    try {
      const completionResponse = await lcuClient.champSelect.patchAction(actionId, {
        championId,
        completed: true,
      })
      appendLog(`champ action completion status: ${completionResponse.status}`)
    } catch (error) {
      appendLog(`champ action failed: ${String(error)}`)
    } finally {
      setChampionActionPending(false)
    }
  }

  async function updateChampionSelectionDraft(value: string) {
    setChampionSelectionDraft(value)

    const championId = Number(value)
    if (!Number.isFinite(championId) || championId <= 0) {
      return
    }

    await patchChampSelectSelection(championId)
  }

  async function rerollChampion() {
    if (status !== RiftClientState.CONNECTED || rerollPending) {
      return
    }

    setRerollPending(true)
    try {
      await lcuClient.champSelect.reroll()
    } catch (error) {
      appendLog(`champ reroll failed: ${String(error)}`)
    } finally {
      setRerollPending(false)
    }
  }

  async function swapBenchChampion(championId: number) {
    if (status !== RiftClientState.CONNECTED || benchSwapPendingId !== null) {
      return
    }

    setBenchSwapPendingId(championId)
    try {
      await lcuClient.champSelect.benchSwap(championId)
    } catch (error) {
      appendLog(`bench swap failed: ${String(error)}`)
    } finally {
      setBenchSwapPendingId(null)
    }
  }

  if (status !== RiftClientState.CONNECTED) {
    return (
      <Card className='p-8 text-center'>
        <h1 className='font-display text-3xl text-primary'>{t(($) => $.connected.unavailableTitle)}</h1>
        <p className='mt-4 text-muted-foreground'>{t(($) => $.connected.unavailableBody)}</p>
        <Button asChild variant='default' className='mt-8 font-display tracking-wider uppercase'>
          <Link to='/'>{t(($) => $.connected.backToConnect)}</Link>
        </Button>
      </Card>
    )
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col px-5 py-8 sm:px-8 h-[calc(100vh-4rem)]'>
      <div className='flex flex-col gap-6 h-full'>
        <ChampSelectCard
          champSelectState={champSelectState}
          championNamesById={championNamesById}
          championMetadataById={championMetadataById}
          rerollPending={rerollPending}
          rerollPoints={rerollPoints}
          rerollChampion={rerollChampion}
          benchSwapPendingId={benchSwapPendingId}
          swapBenchChampion={swapBenchChampion}
          ddragonVersion={ddragonVersionValue}
        />

        {champSelectState ? (
          <Card className='flex-1 overflow-hidden flex flex-col p-4'>
            <ChampSelectTabs activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'champions' && (
                <ChampionsTab
                  champSelectState={champSelectState}
                  championNamesById={championNamesById}
                  championMetadataById={championMetadataById}
                  visibleSelectableChampionIds={visibleSelectableChampionIds}
                  championSelectionDraft={championSelectionDraft}
                  updateChampionSelectionDraft={updateChampionSelectionDraft}
                  completeCurrentChampSelectAction={completeCurrentChampSelectAction}
                  patchChampSelectSelection={patchChampSelectSelection}
                />
              )}

              {activeTab === 'spells' && (
                <SpellsCard
                  availableSpellIds={availableSpellIds}
                  selectedSpell1Draft={selectedSpell1Draft}
                  selectedSpell2Draft={selectedSpell2Draft}
                  selectSummonerSpell={selectSummonerSpell}
                />
              )}

              {activeTab === 'runes' && (
                <RunesTab
                  runePages={runePages}
                  activeRunePage={activeRunePage}
                  onSelectRunePage={(id) => {
                    void selectRunePage(id)
                  }}
                  runeUpdatePending={runeUpdatePending}
                />
              )}

              {activeTab === 'skins' && (
                <SkinsCard
                  skinsForCurrentChampion={skinsForCurrentChampion}
                  championNamesById={championNamesById}
                  championMetadataById={championMetadataById}
                  skinUpdatePending={skinUpdatePending}
                  selectedSkinDraft={selectedSkinDraft}
                  setSelectedSkinDraft={setSelectedSkinDraft}
                  selectSkin={selectSkin}
                />
              )}
            </ChampSelectTabs>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
