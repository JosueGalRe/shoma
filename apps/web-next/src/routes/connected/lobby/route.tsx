import { Link, createFileRoute } from '@tanstack/react-router'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { canTriggerInstallPrompt, readStandaloneMode, triggerInstallPrompt } from '../../../core/platform/web-runtime'
import { RiftClientState } from '../../../core/rift/rift-client-types'
import { formatSeconds } from '../../../core/rift/rift-lcu-utils'
import { useRiftStore } from '../../../core/rift/rift-store'
import { useRiftLcuRuntime } from '../../../features/connect/hooks/use-rift-lcu-runtime'
import { LanguageSwitcher } from '../../../features/i18n/language-switcher'
import {
  championNamesQueryOptions,
  ddragonVersionQueryOptions,
  type DdragonLanguage,
} from '../../../core/http/ddragon-client'
import { ConnectedRunePanel } from './-components/rune-panel'
import {
  EMPTY_PERK_ROW,
  ROLE_OPTIONS,
  findRuneSlotIndex,
  normalizeSelectedPerkIds,
  type ConnectedRunePage,
  type RuneStyle,
} from './-lobby-runes'
import type { InviteDetailsById, LobbyMemberSnapshot } from './-lobby-types'
import { formatRolePair, readSuggestedPlayers } from './-lobby-utils'
import { useConnectedUiStore } from './-lobby-store'
import {
  buildSummonerIconUrl,
  deriveLobbyQueueOptions,
  formatChampionLabel,
  readAudioContextConstructor,
  readQueueDodgePenaltySeconds,
  readSummonerData,
} from './-lobby-utils'

export const Route = createFileRoute('/connected/lobby')({
  component: ConnectedRoute,
})

function ConnectedRoute() {
  const queryClient = useQueryClient()
  const { i18n, t } = useTranslation()
  const {
    status,
    client,
    peerName,
    peerVersion,
    queueState,
    lobbyDetails,
    readyCheckState,
    invites,
    champSelectState,
    logLines,
    setPeer,
    appendLog,
  } = useRiftStore()
  const {
    readyCheckPending,
    setReadyCheckPending,
    inviteActionPendingById,
    setInviteActionPendingById,
    memberActionPendingById,
    setMemberActionPendingById,
    lobbyActionPending,
    setLobbyActionPending,
    selectedQueueId,
    setSelectedQueueId,
    showInvitePanel,
    setShowInvitePanel,
    inviteName,
    setInviteName,
    inviteSubmissionPending,
    setInviteSubmissionPending,
    firstRoleDraft,
    setFirstRoleDraft,
    secondRoleDraft,
    setSecondRoleDraft,
    roleUpdatePending,
    setRoleUpdatePending,
    championActionPending,
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
    installPromptAvailable,
    setInstallPromptAvailable,
    isStandaloneMode,
    setIsStandaloneMode,
  } = useConnectedUiStore()
  const previousReadyCheckStateRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const canPlayQueuePopRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateInstallState = () => {
      setInstallPromptAvailable(canTriggerInstallPrompt(window))
      setIsStandaloneMode(readStandaloneMode(window))
    }

    updateInstallState()

    const mediaQuery = window.matchMedia('(display-mode: standalone)')

    window.addEventListener('beforeinstallprompt', updateInstallState)
    mediaQuery.addEventListener('change', updateInstallState)

    return () => {
      window.removeEventListener('beforeinstallprompt', updateInstallState)
      mediaQuery.removeEventListener('change', updateInstallState)
    }
  }, [])

  const { data: ddragonVersion } = useQuery(ddragonVersionQueryOptions())
  const ddragonLanguage: DdragonLanguage = i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en'
  const { data: championNamesById = {} } = useQuery({
    ...championNamesQueryOptions(ddragonVersion ?? '', ddragonLanguage),
    enabled: Boolean(ddragonVersion),
  })
  const ddragonVersionValue = ddragonVersion ?? null

  const queueDodgePenaltySeconds = useMemo(() => {
    return readQueueDodgePenaltySeconds(queueState?.errors)
  }, [queueState?.errors])

  const { getMapName, getQueueDescription, lcuTransport } = useRiftLcuRuntime({
    appendLog,
    client,
    setPeer,
    status,
  })

  const { data: lobbyQueueOptions = [] } = useQuery({
    queryKey: ['lobby-queue-options'] as const,
    queryFn: async () => {
      try {
        const [enabledResponse, defaultResponse, queueCatalogResponse] = await Promise.all([
          lcuTransport.request('/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues'),
          lcuTransport.request('/lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues'),
          lcuTransport.request('/lol-game-queues/v1/queues'),
        ])

        if (queueCatalogResponse.status !== 200) {
          return []
        }

        return deriveLobbyQueueOptions(
          queueCatalogResponse.content,
          enabledResponse.status === 200 ? enabledResponse.content : null,
          defaultResponse.status === 200 ? defaultResponse.content : null,
        )
      } catch (error) {
        appendLog(`lobby queue options failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED,
    staleTime: 30_000,
  })

  const { data: selectableChampionIds = [] } = useQuery({
    queryKey: ['champ-select-selectable', champSelectState?.currentActionType] as const,
    queryFn: async () => {
      const actionType = champSelectState?.currentActionType
      if (!actionType) {
        return []
      }

      const path = actionType === 'ban' ? '/lol-champ-select/v1/bannable-champion-ids' : '/lol-champ-select/v1/pickable-champion-ids'
      try {
        const response = await lcuTransport.request(path)
        if (response.status !== 200 || !Array.isArray(response.content)) {
          return []
        }

        const available = response.content.filter((value): value is number => typeof value === 'number')

        if (actionType !== 'ban') {
          return available
        }

        return available.filter((championId) => !champSelectState?.bannedChampionIds.includes(championId))
      } catch (error) {
        appendLog(`champ selectable load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState?.isLocalPlayerTurn),
    staleTime: 10_000,
  })

  const { data: rerollPoints } = useQuery({
    queryKey: ['champ-select-reroll-points'] as const,
    queryFn: async () => {
      try {
        const response = await lcuTransport.request('/lol-summoner/v1/current-summoner/rerollPoints')
        if (response.status !== 200 || typeof response.content !== 'object' || response.content === null) {
          return {
            numberOfRolls: 0,
            maxRolls: 0,
          }
        }

        const candidate = response.content as {
          numberOfRolls?: unknown
          maxRolls?: unknown
        }

        return {
          numberOfRolls: typeof candidate.numberOfRolls === 'number' ? candidate.numberOfRolls : 0,
          maxRolls: typeof candidate.maxRolls === 'number' ? candidate.maxRolls : 0,
        }
      } catch (error) {
        appendLog(`reroll points load failed: ${String(error)}`)
        return {
          numberOfRolls: 0,
          maxRolls: 0,
        }
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
        const response = await lcuTransport.request('/lol-gameflow/v1/session')
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
        const response = await lcuTransport.request('/lol-game-data/assets/v1/summoner-spells.json')
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
              gameModes?: unknown
            }

            if (typeof candidate.id !== 'number' || !Array.isArray(candidate.gameModes)) {
              return null
            }

            const gameModes = candidate.gameModes.filter((mode): mode is string => typeof mode === 'string')
            return {
              id: candidate.id,
              gameModes,
            }
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
    return summonerSpellMetadata
      .filter((entry) => entry.gameModes.includes(gameflowMode))
      .map((entry) => entry.id)
  }, [gameflowMode, summonerSpellMetadata])

  const { data: runeStyles = [] } = useQuery({
    queryKey: ['rune-styles'] as const,
    queryFn: async () => {
      try {
        const response = await lcuTransport.request('/lol-perks/v1/styles')
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
              name?: unknown
              slots?: unknown
            }

            if (typeof candidate.id !== 'number' || !Array.isArray(candidate.slots)) {
              return null
            }

            const slots = candidate.slots
              .map((slot) => {
                if (typeof slot !== 'object' || slot === null) {
                  return null
                }

                const slotCandidate = slot as {
                  runes?: unknown
                }
                if (!Array.isArray(slotCandidate.runes)) {
                  return null
                }

                const runes = slotCandidate.runes
                  .map((rune) => {
                    if (typeof rune !== 'object' || rune === null) {
                      return null
                    }

                    const runeCandidate = rune as {
                      id?: unknown
                      name?: unknown
                    }
                    if (typeof runeCandidate.id !== 'number') {
                      return null
                    }

                    return {
                      id: runeCandidate.id,
                      name: typeof runeCandidate.name === 'string' ? runeCandidate.name : `Rune ${runeCandidate.id}`,
                    }
                  })
                  .filter((runeValue) => runeValue !== null)

                return {
                  runes,
                }
              })
              .filter((slotValue) => slotValue !== null)

            return {
              id: candidate.id,
              name: typeof candidate.name === 'string' ? candidate.name : `Style ${candidate.id}`,
              slots,
            }
          })
          .filter((value) => value !== null)
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
        const response = await lcuTransport.request('/lol-perks/v1/pages')
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
              name?: unknown
              isActive?: unknown
              isEditable?: unknown
              primaryStyleId?: unknown
              subStyleId?: unknown
              secondaryStyleId?: unknown
              selectedPerkIds?: unknown
              order?: unknown
            }

            if (typeof candidate.id !== 'number' || typeof candidate.name !== 'string') {
              return null
            }

            return {
              id: candidate.id,
              name: candidate.name,
              isActive: candidate.isActive === true,
              isEditable: candidate.isEditable === true,
              primaryStyleId: typeof candidate.primaryStyleId === 'number' ? candidate.primaryStyleId : null,
              secondaryStyleId:
                typeof candidate.subStyleId === 'number'
                  ? candidate.subStyleId
                  : typeof candidate.secondaryStyleId === 'number'
                    ? candidate.secondaryStyleId
                    : null,
              selectedPerkIds: Array.isArray(candidate.selectedPerkIds)
                ? normalizeSelectedPerkIds(candidate.selectedPerkIds)
                : [...EMPTY_PERK_ROW],
              order: typeof candidate.order === 'number' ? candidate.order : 0,
            }
          })
          .filter((value) => value !== null)
          .sort((left, right) => left.order - right.order)
      } catch (error) {
        appendLog(`rune pages load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && Boolean(champSelectState),
    staleTime: 10_000,
  })

  const activeRunePage = useMemo(() => {
    return runePages.find((runePage) => runePage.isActive) ?? null
  }, [runePages])

  const editableActiveRunePage = useMemo(() => {
    if (!activeRunePage?.isEditable) {
      return null
    }

    return activeRunePage
  }, [activeRunePage])

  const primaryRuneStyle = useMemo(() => {
    if (!editableActiveRunePage?.primaryStyleId) {
      return null
    }

    return runeStyles.find((style) => style.id === editableActiveRunePage.primaryStyleId) ?? null
  }, [editableActiveRunePage?.primaryStyleId, runeStyles])

  const secondaryRuneStyle = useMemo(() => {
    if (!editableActiveRunePage?.secondaryStyleId) {
      return null
    }

    return runeStyles.find((style) => style.id === editableActiveRunePage.secondaryStyleId) ?? null
  }, [editableActiveRunePage?.secondaryStyleId, runeStyles])

  const selectedSecondaryRuneIds = useMemo(() => {
    if (!editableActiveRunePage) {
      return []
    }

    return [editableActiveRunePage.selectedPerkIds[4], editableActiveRunePage.selectedPerkIds[5]].filter(
      (value): value is number => typeof value === 'number' && value > 0,
    )
  }, [editableActiveRunePage])

  const { data: availableSkins = [] } = useQuery({
    queryKey: ['champ-select-skins', champSelectState?.localSummonerId] as const,
    queryFn: async () => {
      const summonerId = champSelectState?.localSummonerId
      if (!summonerId) {
        return []
      }

      try {
        const response = await lcuTransport.request(`/lol-champions/v1/inventories/${summonerId}/skins-minimal`)
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
              ownership?: {
                owned?: unknown
              }
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
    const currentChampionId = champSelectState?.localPlayerChampionId
    if (!currentChampionId) {
      return []
    }

    return availableSkins.filter((skin) => skin.championId === currentChampionId)
  }, [availableSkins, champSelectState?.localPlayerChampionId])

  useEffect(() => {
    if (!champSelectState?.currentActionChampionId || champSelectState.currentActionChampionId <= 0) {
      return
    }

    setChampionSelectionDraft(String(champSelectState.currentActionChampionId))
  }, [champSelectState?.currentActionChampionId])

  useEffect(() => {
    if (typeof champSelectState?.localSpell1Id !== 'number' || typeof champSelectState?.localSpell2Id !== 'number') {
      return
    }

    setSelectedSpell1Draft(String(champSelectState.localSpell1Id))
    setSelectedSpell2Draft(String(champSelectState.localSpell2Id))
  }, [champSelectState?.localSpell1Id, champSelectState?.localSpell2Id])

  useEffect(() => {
    if (typeof champSelectState?.localSelectedSkinId !== 'number') {
      return
    }

    setSelectedSkinDraft(String(champSelectState.localSelectedSkinId))
  }, [champSelectState?.localSelectedSkinId])

  useEffect(() => {
    if (!activeRunePage) {
      setRunePageNameDraft('')
      return
    }

    setRunePageNameDraft(activeRunePage.name)
  }, [activeRunePage])

  useEffect(() => {
    setSecondaryRuneSelectionIndex(0)
  }, [editableActiveRunePage?.id])

  useEffect(() => {
    if (selectedQueueId || lobbyQueueOptions.length === 0) {
      return
    }

    setSelectedQueueId(String(lobbyQueueOptions[0].id))
  }, [lobbyQueueOptions, selectedQueueId])

  const pendingInvites = useMemo(() => {
    return invites.filter((invite) => {
      return invite.state === 'Pending'
    })
  }, [invites])

  const inviteDetailQueries = useMemo(() => {
    return pendingInvites.map((invite) => {
      return {
        queryKey: ['invite-detail', invite.invitationId, invite.fromSummonerId, invite.gameConfig.queueId, invite.gameConfig.mapId] as const,
        queryFn: async () => {
          try {
            const summonerResponse = await lcuTransport.request(`/lol-summoner/v1/summoners/${invite.fromSummonerId}`)
            const summonerData =
              summonerResponse.status === 200
                ? readSummonerData(summonerResponse.content)
                : {
                    displayName: null,
                    profileIconId: null,
                  }

            let queueName: string | null = null
            if (typeof invite.gameConfig.queueId === 'number') {
              queueName = await getQueueDescription(invite.gameConfig.queueId)
            }

            let mapName: string | null = null
            if (typeof invite.gameConfig.mapId === 'number') {
              mapName = await getMapName(invite.gameConfig.mapId)
            }

            return {
              mapName,
              queueName,
              summonerName: summonerData.displayName,
              profileIconId: summonerData.profileIconId,
            }
          } catch (error) {
            appendLog(`invite detail load failed: ${String(error)}`)

            return {
              mapName: null,
              queueName: null,
              summonerName: null,
              profileIconId: null,
            }
          }
        },
        enabled: status === RiftClientState.CONNECTED,
        staleTime: 30_000,
      }
    })
  }, [appendLog, getMapName, getQueueDescription, lcuTransport, pendingInvites, status])

  const inviteDetailResults = useQueries({
    queries: inviteDetailQueries,
  })

  const inviteDetailsById = useMemo(() => {
    const nextInviteDetailsById: InviteDetailsById = {}

    pendingInvites.forEach((invite, index) => {
      const detail = inviteDetailResults[index]?.data
      if (!detail) {
        return
      }

      nextInviteDetailsById[invite.invitationId] = detail
    })

    return nextInviteDetailsById
  }, [inviteDetailResults, pendingInvites])

  const lobbyMemberQueries = useMemo(() => {
    return (lobbyDetails?.members ?? []).map((member) => {
      return {
        queryKey: ['lobby-member', member.summonerId] as const,
        queryFn: async () => {
          try {
            const response = await lcuTransport.request(`/lol-summoner/v1/summoners/${member.summonerId}`)
            if (response.status !== 200) {
              return {
                displayName: null,
                profileIconId: null,
              }
            }

            return readSummonerData(response.content)
          } catch (error) {
            appendLog(`lobby member load failed: ${String(error)}`)
            return {
              displayName: null,
              profileIconId: null,
            }
          }
        },
        enabled: status === RiftClientState.CONNECTED,
        staleTime: 30_000,
      }
    })
  }, [appendLog, lcuTransport, lobbyDetails?.members, status])

  const lobbyMemberResults = useQueries({
    queries: lobbyMemberQueries,
  })

  const lobbyMembers = useMemo(() => {
    const baseMembers = lobbyDetails?.members ?? []
    const snapshots: LobbyMemberSnapshot[] = []

    baseMembers.forEach((member, index) => {
      const memberProfile = lobbyMemberResults[index]?.data
      snapshots.push({
        ...member,
        displayName: memberProfile?.displayName ?? null,
        profileIconId: memberProfile?.profileIconId ?? null,
      })
    })

    snapshots.sort((left, right) => {
      if (left.isLocalMember && !right.isLocalMember) {
        return -1
      }

      if (!left.isLocalMember && right.isLocalMember) {
        return 1
      }

      return 0
    })

    return snapshots
  }, [lobbyDetails?.members, lobbyMemberResults])

  const localLobbyMember = useMemo(() => {
    return lobbyMembers.find((member) => member.isLocalMember) ?? null
  }, [lobbyMembers])

  const canInviteOthers = Boolean(localLobbyMember?.allowedInviteOthers)

  useEffect(() => {
    if (!localLobbyMember) {
      return
    }

    setFirstRoleDraft(localLobbyMember.firstPositionPreference)
    setSecondRoleDraft(localLobbyMember.secondPositionPreference)
  }, [localLobbyMember])

  const { data: suggestedPlayers = [] } = useQuery({
    queryKey: ['suggested-players'] as const,
    queryFn: async () => {
      try {
        const response = await lcuTransport.request('/lol-suggested-players/v1/suggested-players')
        if (response.status !== 200) {
          return []
        }

        return readSuggestedPlayers(response.content)
      } catch (error) {
        appendLog(`suggested players load failed: ${String(error)}`)
        return []
      }
    },
    enabled: status === RiftClientState.CONNECTED && showInvitePanel && canInviteOthers,
    staleTime: 30_000,
  })

  async function sendReadyCheckResponse(path: string, logMessage: string) {
    if (readyCheckPending || status !== RiftClientState.CONNECTED) {
      return
    }

    setReadyCheckPending(true)
    try {
      await lcuTransport.request(path, 'POST')
    } catch (error) {
      appendLog(`${logMessage}: ${String(error)}`)
    } finally {
      setReadyCheckPending(false)
    }
  }

  async function updateEditableRunePage(mutator: (page: { [key: string]: unknown; selectedPerkIds: number[] }) => void) {
    const targetPage = editableActiveRunePage
    if (!targetPage || status !== RiftClientState.CONNECTED || runeEditPending) {
      return
    }

    setRuneEditPending(true)
    try {
      const detailResponse = await lcuTransport.request(`/lol-perks/v1/pages/${targetPage.id}`)
      if (detailResponse.status !== 200 || typeof detailResponse.content !== 'object' || detailResponse.content === null) {
        return
      }

      const runePageDetail = detailResponse.content as {
        selectedPerkIds?: unknown
        [key: string]: unknown
      }

      const payload = {
        ...runePageDetail,
        selectedPerkIds: normalizeSelectedPerkIds(runePageDetail.selectedPerkIds),
      }

      mutator(payload)

      await lcuTransport.request(`/lol-perks/v1/pages/${targetPage.id}`, 'PUT', JSON.stringify(payload))
      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page edit failed: ${String(error)}`)
    } finally {
      setRuneEditPending(false)
    }
  }

  async function selectPrimaryRuneStyle(styleId: number) {
    const targetPage = editableActiveRunePage
    if (!targetPage || targetPage.primaryStyleId === styleId) {
      return
    }

    const fallbackSecondaryStyle = runeStyles.find((style) => style.id !== styleId)
    await updateEditableRunePage((page) => {
      page.primaryStyleId = styleId
      page.subStyleId = fallbackSecondaryStyle?.id ?? page.subStyleId ?? styleId
      page.secondaryStyleId = page.subStyleId

      page.selectedPerkIds = [
        0,
        0,
        0,
        0,
        0,
        0,
        page.selectedPerkIds[6] ?? 0,
        page.selectedPerkIds[7] ?? 0,
        page.selectedPerkIds[8] ?? 0,
      ]
      setSecondaryRuneSelectionIndex(0)
    })
  }

  async function selectPrimaryRune(slotIndex: number, runeId: number) {
    await updateEditableRunePage((page) => {
      page.selectedPerkIds[slotIndex] = runeId
    })
  }

  async function selectSecondaryRuneStyle(styleId: number) {
    const targetPage = editableActiveRunePage
    if (!targetPage || targetPage.primaryStyleId === styleId || targetPage.secondaryStyleId === styleId) {
      return
    }

    await updateEditableRunePage((page) => {
      page.subStyleId = styleId
      page.secondaryStyleId = styleId
      page.selectedPerkIds[4] = 0
      page.selectedPerkIds[5] = 0
      setSecondaryRuneSelectionIndex(0)
    })
  }

  async function selectSecondaryRune(runeId: number) {
    const targetPage = editableActiveRunePage
    const targetStyle = secondaryRuneStyle
    if (!targetPage || !targetStyle) {
      return
    }

    const selectedPerkIds = targetPage.selectedPerkIds
    const replacementIndex = 4 + secondaryRuneSelectionIndex
    const otherRuneId = selectedPerkIds[replacementIndex]
    const runeSlotIndex = findRuneSlotIndex(targetStyle, runeId)
    if (runeSlotIndex < 0) {
      return
    }

    if (otherRuneId > 0) {
      const otherRuneSlotIndex = findRuneSlotIndex(targetStyle, otherRuneId)
      if (otherRuneSlotIndex === runeSlotIndex) {
        return
      }
    }

    const nextSecondaryIndex = (secondaryRuneSelectionIndex + 1) % 2
    const assignIndex = 4 + nextSecondaryIndex

    await updateEditableRunePage((page) => {
      page.selectedPerkIds[assignIndex] = runeId
      setSecondaryRuneSelectionIndex(nextSecondaryIndex)
    })
  }

  async function selectStatShard(slotIndex: number, runeId: number) {
    await updateEditableRunePage((page) => {
      page.selectedPerkIds[6 + slotIndex] = runeId
    })
  }

  async function createRunePage() {
    if (status !== RiftClientState.CONNECTED || runePageActionPending) {
      return
    }

    const fallbackPrimaryStyleId = runeStyles[0]?.id ?? 8000
    const fallbackSecondaryStyleId = runeStyles[1]?.id ?? runeStyles[0]?.id ?? 8100
    const templatePage = activeRunePage

    const body = {
      name: t(($) => $.connected.champSelectRunesNewName, { value: runePages.length + 1 }),
      primaryStyleId: templatePage?.primaryStyleId ?? fallbackPrimaryStyleId,
      secondaryStyleId: templatePage?.secondaryStyleId ?? fallbackSecondaryStyleId,
      selectedPerkIds: templatePage?.selectedPerkIds.length ? templatePage.selectedPerkIds : [0, 0, 0, 0, 0, 0, 0, 0, 0],
    }

    setRunePageActionPending(true)
    try {
      const response = await lcuTransport.request('/lol-perks/v1/pages', 'POST', JSON.stringify(body))
      if (response.status === 200 && typeof response.content === 'object' && response.content !== null) {
        const createdPage = response.content as {
          id?: unknown
        }

        if (typeof createdPage.id === 'number') {
          await lcuTransport.request('/lol-perks/v1/currentpage', 'PUT', String(createdPage.id))
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page create failed: ${String(error)}`)
    } finally {
      setRunePageActionPending(false)
    }
  }

  async function renameActiveRunePage() {
    const targetPage = activeRunePage
    const nextName = runePageNameDraft.trim()
    if (!targetPage || !targetPage.isEditable || nextName.length === 0 || status !== RiftClientState.CONNECTED || runePageActionPending) {
      return
    }

    setRunePageActionPending(true)
    try {
      const detailResponse = await lcuTransport.request(`/lol-perks/v1/pages/${targetPage.id}`)
      if (detailResponse.status !== 200 || typeof detailResponse.content !== 'object' || detailResponse.content === null) {
        return
      }

      const runePageDetail = detailResponse.content as {
        name?: unknown
      }
      await lcuTransport.request(
        `/lol-perks/v1/pages/${targetPage.id}`,
        'PUT',
        JSON.stringify({
          ...runePageDetail,
          name: nextName,
        }),
      )

      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page rename failed: ${String(error)}`)
    } finally {
      setRunePageActionPending(false)
    }
  }

  async function deleteActiveRunePage() {
    const targetPage = activeRunePage
    if (!targetPage || !targetPage.isEditable || status !== RiftClientState.CONNECTED || runePageActionPending) {
      return
    }

    const confirmed = window.confirm(t(($) => $.connected.champSelectRunesDeleteConfirm, { value: targetPage.name }))
    if (!confirmed) {
      return
    }

    setRunePageActionPending(true)
    try {
      await lcuTransport.request(`/lol-perks/v1/pages/${targetPage.id}`, 'DELETE')
      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page delete failed: ${String(error)}`)
    } finally {
      setRunePageActionPending(false)
    }
  }

  async function updateSummonerSpells() {
    const spell1Id = Number(selectedSpell1Draft)
    const spell2Id = Number(selectedSpell2Draft)

    if (!Number.isFinite(spell1Id) || !Number.isFinite(spell2Id) || spellUpdatePending || status !== RiftClientState.CONNECTED) {
      return
    }

    setSpellUpdatePending(true)
    try {
      await lcuTransport.request(
        '/lol-champ-select/v1/session/my-selection',
        'PATCH',
        JSON.stringify({
          spell1Id,
          spell2Id,
        }),
      )
    } catch (error) {
      appendLog(`spell update failed: ${String(error)}`)
    } finally {
      setSpellUpdatePending(false)
    }
  }

  async function selectRunePage(runePageId: number) {
    if (status !== RiftClientState.CONNECTED || runeUpdatePending) {
      return
    }

    setRuneUpdatePending(true)
    try {
      await lcuTransport.request('/lol-perks/v1/currentpage', 'PUT', String(runePageId))
      await queryClient.invalidateQueries({ queryKey: ['rune-pages'] })
    } catch (error) {
      appendLog(`rune page select failed: ${String(error)}`)
    } finally {
      setRuneUpdatePending(false)
    }
  }

  async function selectSkin() {
    const selectedSkinId = Number(selectedSkinDraft)
    if (!Number.isFinite(selectedSkinId) || selectedSkinId <= 0 || skinUpdatePending || status !== RiftClientState.CONNECTED) {
      return
    }

    setSkinUpdatePending(true)
    try {
      await lcuTransport.request(
        '/lol-champ-select/v1/session/my-selection',
        'PATCH',
        JSON.stringify({
          selectedSkinId,
        }),
      )
    } catch (error) {
      appendLog(`skin update failed: ${String(error)}`)
    } finally {
      setSkinUpdatePending(false)
    }
  }

  async function patchChampSelectAction(championId: number, completeAction: boolean) {
    if (!champSelectState?.currentActionId || status !== RiftClientState.CONNECTED || championActionPending) {
      return
    }

    setChampionActionPending(true)
    try {
      await lcuTransport.request(
        `/lol-champ-select/v1/session/actions/${champSelectState.currentActionId}`,
        'PATCH',
        JSON.stringify({
          championId,
          completed: completeAction,
        }),
      )
    } catch (error) {
      appendLog(`champ action failed: ${String(error)}`)
    } finally {
      setChampionActionPending(false)
    }
  }

  async function applyChampionSelectionDraft(completeAction: boolean) {
    const championId = Number(championSelectionDraft)
    if (!Number.isFinite(championId) || championId <= 0) {
      return
    }

    await patchChampSelectAction(championId, completeAction)
  }

  async function rerollChampion() {
    if (status !== RiftClientState.CONNECTED || rerollPending) {
      return
    }

    setRerollPending(true)
    try {
      await lcuTransport.request('/lol-champ-select/v1/session/my-selection/reroll', 'POST')
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
      await lcuTransport.request(`/lol-champ-select/v1/session/bench/swap/${championId}`, 'POST')
    } catch (error) {
      appendLog(`bench swap failed: ${String(error)}`)
    } finally {
      setBenchSwapPendingId(null)
    }
  }

  async function sendLobbyRequest(path: string, method: 'DELETE' | 'POST', body?: string) {
    if (status !== RiftClientState.CONNECTED || lobbyActionPending) {
      return
    }

    setLobbyActionPending(true)
    try {
      await lcuTransport.request(path, method, body)
    } catch (error) {
      appendLog(`lobby action failed (${method} ${path}): ${String(error)}`)
    } finally {
      setLobbyActionPending(false)
    }
  }

  async function leaveQueue() {
    await sendLobbyRequest('/lol-lobby/v2/lobby/matchmaking/search', 'DELETE')
  }

  async function leaveLobby() {
    const shouldLeave = window.confirm(t(($) => $.connected.leaveLobbyConfirm))
    if (!shouldLeave) {
      return
    }

    await sendLobbyRequest('/lol-lobby/v2/lobby', 'DELETE')
  }

  async function joinQueue() {
    if (queueDodgePenaltySeconds >= 0) {
      return
    }

    await sendLobbyRequest('/lol-lobby/v2/lobby/matchmaking/search', 'POST')
  }

  async function createLobby() {
    const queueId = Number(selectedQueueId)
    if (!Number.isFinite(queueId) || queueId <= 0) {
      return
    }

    await sendLobbyRequest('/lol-lobby/v2/lobby', 'POST', JSON.stringify({ queueId }))
  }

  async function setMemberActionPending(summonerId: number, pending: boolean) {
    setMemberActionPendingById((previous) => {
      return {
        ...previous,
        [summonerId]: pending,
      }
    })
  }

  async function sendMemberAction(summonerId: number, path: string, confirmPrompt?: string) {
    if (status !== RiftClientState.CONNECTED || memberActionPendingById[summonerId]) {
      return
    }

    if (confirmPrompt && !window.confirm(confirmPrompt)) {
      return
    }

    await setMemberActionPending(summonerId, true)
    try {
      await lcuTransport.request(path, 'POST')
    } catch (error) {
      appendLog(`member action failed (${path}): ${String(error)}`)
    } finally {
      await setMemberActionPending(summonerId, false)
    }
  }

  async function promoteMember(member: LobbyMemberSnapshot) {
    const displayName = member.displayName ?? t(($) => $.connected.unknownSummoner)
    await sendMemberAction(
      member.summonerId,
      `/lol-lobby/v2/lobby/members/${member.summonerId}/promote`,
      t(($) => $.connected.promoteConfirm, { value: displayName }),
    )
  }

  async function kickMember(member: LobbyMemberSnapshot) {
    const displayName = member.displayName ?? t(($) => $.connected.unknownSummoner)
    await sendMemberAction(
      member.summonerId,
      `/lol-lobby/v2/lobby/members/${member.summonerId}/kick`,
      t(($) => $.connected.kickConfirm, { value: displayName }),
    )
  }

  async function toggleMemberInvite(member: LobbyMemberSnapshot) {
    const action = member.allowedInviteOthers ? 'revoke-invite' : 'grant-invite'
    await sendMemberAction(member.summonerId, `/lol-lobby/v2/lobby/members/${member.summonerId}/${action}`)
  }

  async function inviteSummoner(toSummonerId: number) {
    if (status !== RiftClientState.CONNECTED || inviteSubmissionPending) {
      return
    }

    setInviteSubmissionPending(true)
    try {
      await lcuTransport.request('/lol-lobby/v2/lobby/invitations', 'POST', JSON.stringify([{ toSummonerId }]))
      setInviteName('')
    } catch (error) {
      appendLog(`invite submission failed: ${String(error)}`)
    } finally {
      setInviteSubmissionPending(false)
    }
  }

  async function inviteByName() {
    const normalized = inviteName.trim()
    if (!normalized || status !== RiftClientState.CONNECTED || inviteSubmissionPending) {
      return
    }

    setInviteSubmissionPending(true)
    try {
      const response = await lcuTransport.request(`/lol-summoner/v1/summoners?name=${encodeURIComponent(normalized)}`)
      if (response.status !== 200 || typeof (response.content as { summonerId?: unknown }).summonerId !== 'number') {
        appendLog(`invite lookup failed for ${normalized}`)
        return
      }

      const summonerId = (response.content as { summonerId: number }).summonerId
      await lcuTransport.request('/lol-lobby/v2/lobby/invitations', 'POST', JSON.stringify([{ toSummonerId: summonerId }]))
      setInviteName('')
    } catch (error) {
      appendLog(`invite lookup failed: ${String(error)}`)
    } finally {
      setInviteSubmissionPending(false)
    }
  }

  async function updateRoles() {
    if (status !== RiftClientState.CONNECTED || roleUpdatePending || !localLobbyMember) {
      return
    }

    setRoleUpdatePending(true)
    try {
      await lcuTransport.request(
        '/lol-lobby/v2/lobby/members/localMember/position-preferences',
        'PUT',
        JSON.stringify({
          firstPreference: firstRoleDraft,
          secondPreference: secondRoleDraft,
        }),
      )
    } catch (error) {
      appendLog(`role update failed: ${String(error)}`)
    } finally {
      setRoleUpdatePending(false)
    }
  }

  async function showInstallPrompt() {
    try {
      await triggerInstallPrompt(window)
    } catch (error) {
      appendLog(`install prompt failed: ${String(error)}`)
    } finally {
      setInstallPromptAvailable(canTriggerInstallPrompt(window))
      setIsStandaloneMode(readStandaloneMode(window))
    }
  }

  async function acceptReadyCheck() {
    await sendReadyCheckResponse('/lol-matchmaking/v1/ready-check/accept', 'ready check accept failed')
  }

  async function declineReadyCheck() {
    await sendReadyCheckResponse('/lol-matchmaking/v1/ready-check/decline', 'ready check decline failed')
  }

  async function sendInviteResponse(invitationId: string, action: 'accept' | 'decline') {
    if (status !== RiftClientState.CONNECTED || inviteActionPendingById[invitationId]) {
      return
    }

    setInviteActionPendingById((previous) => {
      return {
        ...previous,
        [invitationId]: true,
      }
    })

    try {
      await lcuTransport.request(`/lol-lobby/v2/received-invitations/${invitationId}/${action}`, 'POST')
    } catch (error) {
      appendLog(`invite ${action} failed (${invitationId}): ${String(error)}`)
    } finally {
      setInviteActionPendingById((previous) => {
        return {
          ...previous,
          [invitationId]: false,
        }
      })
    }
  }

  const readyCheckVisible = readyCheckState?.state === 'InProgress'
  const readyCheckResponded =
    readyCheckState?.playerResponse === 'Accepted' || readyCheckState?.playerResponse === 'Declined'

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextCtor = readAudioContextConstructor()
    if (!AudioContextCtor) {
      canPlayQueuePopRef.current = false
      return
    }

    const unlockAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextCtor()
      }

      void audioContextRef.current.resume()
      canPlayQueuePopRef.current = true
    }

    window.addEventListener('pointerdown', unlockAudio, { passive: true })
    window.addEventListener('touchstart', unlockAudio, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  useEffect(() => {
    const previousState = previousReadyCheckStateRef.current
    const currentState = readyCheckState?.state ?? null
    previousReadyCheckStateRef.current = currentState

    if (previousState !== 'Invalid' || currentState !== 'InProgress') {
      return
    }

    if (canPlayQueuePopRef.current && audioContextRef.current) {
      try {
        const now = audioContextRef.current.currentTime
        const firstOscillator = audioContextRef.current.createOscillator()
        const secondOscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()

        firstOscillator.type = 'sine'
        firstOscillator.frequency.value = 880
        secondOscillator.type = 'sine'
        secondOscillator.frequency.value = 660

        gainNode.gain.setValueAtTime(0.001, now)
        gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

        firstOscillator.connect(gainNode)
        secondOscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        firstOscillator.start(now)
        secondOscillator.start(now + 0.12)
        firstOscillator.stop(now + 0.2)
        secondOscillator.stop(now + 0.45)
      } catch (error) {
        appendLog(`ready check sound failed: ${String(error)}`)
      }
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250])
    }
  }, [appendLog, readyCheckState?.state])

  if (status !== RiftClientState.CONNECTED) {
    return (
      <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
        <Card className='rounded-3xl border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10'>
          <h1 className='font-display text-ink text-3xl'>{t(($) => $.connected.unavailableTitle)}</h1>
          <p className='mt-3 text-slate-700'>{t(($) => $.connected.unavailableBody)}</p>
          <Button asChild className='bg-ink font-display text-mist hover:bg-slate mt-6 h-12 rounded-2xl px-5'>
            <Link to='/'>{t(($) => $.connected.backToConnect)}</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8'>
      <Card className='rounded-3xl border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur sm:p-10'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-display text-ink text-4xl leading-tight'>{t(($) => $.connected.title)}</h1>
          <div className='flex items-center gap-2'>
            <LanguageSwitcher />
            <Button asChild variant='outline' className='font-display h-11 rounded-2xl border-slate-300 px-4 text-slate-700'>
              <Link to='/'>{t(($) => $.connected.back)}</Link>
            </Button>
          </div>
        </div>

        <div className='mt-8 grid gap-4 sm:grid-cols-2'>
          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.desktop)}</h3>
            <p className='mt-2 text-slate-700'>{peerName ?? t(($) => $.connected.unknownMachine)}</p>
            <p className='text-sm text-slate-500'>
              <Trans
                components={{ value: <span className='font-semibold' /> }}
                i18nKey={($) => $.connected.versionValue}
                values={{ value: peerVersion ?? t(($) => $.connected.pending) }}
              />
            </p>
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.queue)}</h3>
            {queueState ? (
              <div className='mt-2 space-y-2 text-slate-700'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.stateValue}
                    values={{ value: queueState.searchState ?? t(($) => $.connected.searching) }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.elapsedValue}
                    values={{ value: formatSeconds(queueState.timeInQueue ?? 0) }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.estimatedValue}
                    values={{ value: formatSeconds(queueState.estimatedQueueTime ?? 0) }}
                  />
                </p>
                <Button
                  className='font-display mt-1 h-9 rounded-xl bg-slate-700 px-3 text-white hover:bg-slate-800'
                  disabled={lobbyActionPending}
                  onClick={() => {
                    void leaveQueue()
                  }}
                  type='button'
                >
                  {t(($) => $.connected.queueLeave)}
                </Button>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.notInQueue)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.readyCheck)}</h3>
            {readyCheckVisible && readyCheckState ? (
              <div className='mt-2 space-y-3 text-slate-700'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.readyCheckTimerValue}
                    values={{ value: readyCheckState.timer }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.readyCheckResponseValue}
                    values={{ value: readyCheckState.playerResponse }}
                  />
                </p>
                <div className='flex gap-2'>
                  <Button
                    className='font-display h-10 rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700'
                    disabled={readyCheckPending || readyCheckResponded}
                    onClick={acceptReadyCheck}
                    type='button'
                  >
                    {t(($) => $.connected.readyCheckAccept)}
                  </Button>
                  <Button
                    className='font-display h-10 rounded-xl bg-rose-600 px-4 text-white hover:bg-rose-700'
                    disabled={readyCheckPending || readyCheckResponded}
                    onClick={declineReadyCheck}
                    type='button'
                  >
                    {t(($) => $.connected.readyCheckDecline)}
                  </Button>
                </div>
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.readyCheckNone)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.lobby)}</h3>
            {lobbyDetails ? (
              <div className='mt-2 grid gap-2 text-slate-700 sm:grid-cols-2'>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.membersValue}
                    values={{ value: lobbyDetails.memberCount }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.invitesValue}
                    values={{ value: lobbyDetails.inviteCount }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.queueLabelValue}
                    values={{
                      value: lobbyDetails.queueName ?? lobbyDetails.queueId ?? t(($) => $.connected.unknown),
                    }}
                  />
                </p>
                <p>
                  <Trans
                    components={{ value: <span className='font-semibold' /> }}
                    i18nKey={($) => $.connected.mapValue}
                    values={{
                      value: lobbyDetails.mapName ?? lobbyDetails.mapId ?? t(($) => $.connected.unknown),
                    }}
                  />
                </p>
                <div className='mt-2 flex flex-wrap gap-2 sm:col-span-2'>
                  <Button
                    className='bg-ink font-display text-mist hover:bg-slate h-10 rounded-xl px-4'
                    disabled={lobbyActionPending || Boolean(queueState)}
                    onClick={() => {
                      void joinQueue()
                    }}
                    type='button'
                  >
                    {t(($) => $.connected.lobbyJoinQueue)}
                  </Button>
                  <Button
                    className='font-display h-10 rounded-xl bg-rose-600 px-4 text-white hover:bg-rose-700'
                    disabled={lobbyActionPending}
                    onClick={() => {
                      void leaveLobby()
                    }}
                    type='button'
                  >
                    {t(($) => $.connected.lobbyLeave)}
                  </Button>
                  {queueDodgePenaltySeconds >= 0 ? (
                    <p className='self-center text-sm text-slate-600'>
                      <Trans
                        components={{ value: <span className='font-semibold' /> }}
                        i18nKey={($) => $.connected.queueBlockedValue}
                        values={{ value: formatSeconds(queueDodgePenaltySeconds) }}
                      />
                    </p>
                  ) : null}
                </div>

                {lobbyMembers.length > 0 ? (
                  <div className='mt-3 space-y-2 sm:col-span-2'>
                    {lobbyMembers.map((member) => {
                      const actionPending = memberActionPendingById[member.summonerId]
                      const canModerate = Boolean(lobbyDetails.localIsLeader && !member.isLocalMember)
                      const memberName = member.displayName ?? t(($) => $.connected.unknownSummoner)

                      return (
                        <div
                          className='flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between'
                          key={member.summonerId}
                        >
                          <div className='flex min-w-0 items-center gap-3'>
                            {buildSummonerIconUrl(ddragonVersionValue, member.profileIconId) ? (
                              <img
                                alt={memberName}
                                className='h-10 w-10 rounded-full border border-slate-200 bg-white object-cover'
                                src={buildSummonerIconUrl(ddragonVersionValue, member.profileIconId) ?? undefined}
                              />
                            ) : (
                              <div className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500'>
                                ?
                              </div>
                            )}
                            <div className='min-w-0'>
                              <p className='truncate font-semibold text-slate-800'>
                                {memberName}
                                {member.isLeader ? ` (${t(($) => $.connected.lobbyLeader)})` : ''}
                              </p>
                              {lobbyDetails.showPositionSelector ? (
                                <p className='text-xs text-slate-600'>
                                  {formatRolePair(
                                    member.firstPositionPreference,
                                    member.secondPositionPreference,
                                    t(($) => $.connected.roleFill),
                                    t(($) => $.connected.roleUnset),
                                  )}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {canModerate ? (
                            <div className='flex flex-wrap gap-2'>
                              <Button
                                className='font-display h-8 rounded-lg bg-amber-500 px-3 text-white hover:bg-amber-600'
                                disabled={Boolean(actionPending)}
                                onClick={() => {
                                  void promoteMember(member)
                                }}
                                type='button'
                              >
                                {t(($) => $.connected.memberPromote)}
                              </Button>
                              <Button
                                className='font-display h-8 rounded-lg bg-sky-600 px-3 text-white hover:bg-sky-700'
                                disabled={Boolean(actionPending)}
                                onClick={() => {
                                  void toggleMemberInvite(member)
                                }}
                                type='button'
                              >
                                {member.allowedInviteOthers
                                  ? t(($) => $.connected.memberInviteRevoke)
                                  : t(($) => $.connected.memberInviteGrant)}
                              </Button>
                              <Button
                                className='font-display h-8 rounded-lg bg-rose-600 px-3 text-white hover:bg-rose-700'
                                disabled={Boolean(actionPending)}
                                onClick={() => {
                                  void kickMember(member)
                                }}
                                type='button'
                              >
                                {t(($) => $.connected.memberKick)}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                {canInviteOthers ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
                    <div className='flex items-center justify-between'>
                      <p className='font-semibold text-slate-800'>{t(($) => $.connected.lobbyInvitesPanel)}</p>
                      <Button
                        className='font-display h-8 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                        onClick={() => {
                          setShowInvitePanel((previous) => !previous)
                        }}
                        type='button'
                        variant='secondary'
                      >
                        {showInvitePanel ? t(($) => $.connected.invitePanelClose) : t(($) => $.connected.invitePanelOpen)}
                      </Button>
                    </div>

                    {showInvitePanel ? (
                      <div className='mt-3 space-y-3'>
                        <div className='flex gap-2'>
                          <input
                            className='h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                            onChange={(event) => {
                              setInviteName(event.target.value)
                            }}
                            placeholder={t(($) => $.connected.inviteByNamePlaceholder)}
                            value={inviteName}
                          />
                          <Button
                            className='font-display h-9 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                            disabled={inviteSubmissionPending || inviteName.trim().length === 0}
                            onClick={() => {
                              void inviteByName()
                            }}
                            type='button'
                          >
                            {t(($) => $.connected.inviteByNameAction)}
                          </Button>
                        </div>

                        {suggestedPlayers.length > 0 ? (
                          <ul className='space-y-2'>
                            {suggestedPlayers.map((suggestion) => (
                              <li className='flex items-center justify-between rounded-lg bg-white px-3 py-2' key={suggestion.summonerId}>
                                <span className='text-sm text-slate-700'>{suggestion.summonerName}</span>
                                <Button
                                  className='font-display h-8 rounded-lg bg-emerald-600 px-3 text-white hover:bg-emerald-700'
                                  disabled={inviteSubmissionPending}
                                  onClick={() => {
                                    void inviteSummoner(suggestion.summonerId)
                                  }}
                                  type='button'
                                >
                                  {t(($) => $.connected.inviteSuggestedAction)}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className='text-sm text-slate-500'>{t(($) => $.connected.inviteNoSuggestions)}</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {lobbyDetails.showPositionSelector && localLobbyMember ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
                    <p className='font-semibold text-slate-800'>{t(($) => $.connected.rolePreferencesTitle)}</p>
                    <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                      <select
                        className='h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setFirstRoleDraft(nextValue)
                          if (nextValue === 'FILL') {
                            setSecondRoleDraft('UNSELECTED')
                          } else if (nextValue === secondRoleDraft) {
                            setSecondRoleDraft('UNSELECTED')
                          }
                        }}
                        value={firstRoleDraft}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>

                      <select
                        className='h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                        disabled={firstRoleDraft === 'FILL'}
                        onChange={(event) => {
                          setSecondRoleDraft(event.target.value)
                        }}
                        value={firstRoleDraft === 'FILL' ? 'UNSELECTED' : secondRoleDraft}
                      >
                        {ROLE_OPTIONS.filter((role) => role !== 'FILL').map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      className='font-display mt-3 h-9 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                      disabled={roleUpdatePending}
                      onClick={() => {
                        void updateRoles()
                      }}
                      type='button'
                    >
                      {t(($) => $.connected.roleSave)}
                    </Button>
                  </div>
                ) : null}

                <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
                  <p className='font-semibold text-slate-800'>{t(($) => $.connected.champSelectSpellsTitle)}</p>
                  {availableSpellIds.length > 0 ? (
                    <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
                      <select
                        className='h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                        onChange={(event) => {
                          setSelectedSpell1Draft(event.target.value)
                        }}
                        value={selectedSpell1Draft}
                      >
                        {availableSpellIds.map((spellId) => (
                          <option key={spellId} value={spellId}>
                            {t(($) => $.connected.champSelectSpellValue, { value: spellId })}
                          </option>
                        ))}
                      </select>

                      <select
                        className='h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                        onChange={(event) => {
                          setSelectedSpell2Draft(event.target.value)
                        }}
                        value={selectedSpell2Draft}
                      >
                        {availableSpellIds.map((spellId) => (
                          <option key={spellId} value={spellId}>
                            {t(($) => $.connected.champSelectSpellValue, { value: spellId })}
                          </option>
                        ))}
                      </select>

                      <Button
                        className='font-display h-9 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                        disabled={spellUpdatePending || selectedSpell1Draft.length === 0 || selectedSpell2Draft.length === 0}
                        onClick={() => {
                          void updateSummonerSpells()
                        }}
                        type='button'
                      >
                        {t(($) => $.connected.champSelectSpellsApply)}
                      </Button>
                    </div>
                  ) : (
                    <p className='mt-2 text-sm text-slate-500'>{t(($) => $.connected.champSelectNoSpells)}</p>
                  )}
                </div>

                <ConnectedRunePanel
                  activeRunePage={activeRunePage}
                  createLabel={t(($) => $.connected.champSelectRunesCreate)}
                  deleteLabel={t(($) => $.connected.champSelectRunesDelete)}
                  editableActiveRunePage={editableActiveRunePage}
                  noEditorDataLabel={t(($) => $.connected.champSelectRunesNoEditorData)}
                  noRunesLabel={t(($) => $.connected.champSelectNoRunes)}
                  onCreateRunePage={() => {
                    void createRunePage()
                  }}
                  onDeleteActiveRunePage={() => {
                    void deleteActiveRunePage()
                  }}
                  onRenameActiveRunePage={() => {
                    void renameActiveRunePage()
                  }}
                  onRunePageNameDraftChange={setRunePageNameDraft}
                  onSelectPrimaryRune={(slotIndex, runeId) => {
                    void selectPrimaryRune(slotIndex, runeId)
                  }}
                  onSelectPrimaryRuneStyle={(styleId) => {
                    void selectPrimaryRuneStyle(styleId)
                  }}
                  onSelectRunePage={(id) => {
                    void selectRunePage(id)
                  }}
                  onSelectSecondaryRune={(runeId) => {
                    void selectSecondaryRune(runeId)
                  }}
                  onSelectSecondaryRuneStyle={(styleId) => {
                    void selectSecondaryRuneStyle(styleId)
                  }}
                  onSelectStatShard={(slotIndex, runeId) => {
                    void selectStatShard(slotIndex, runeId)
                  }}
                  primaryRuneStyle={primaryRuneStyle}
                  primaryTreeLabel={t(($) => $.connected.champSelectRunesPrimaryTree)}
                  renameLabel={t(($) => $.connected.champSelectRunesRename)}
                  renamePlaceholder={t(($) => $.connected.champSelectRunesRenamePlaceholder)}
                  runeEditPending={runeEditPending}
                  runePageActionPending={runePageActionPending}
                  runePageNameDraft={runePageNameDraft}
                  runePages={runePages}
                  runeStyles={runeStyles}
                  runeUpdatePending={runeUpdatePending}
                  secondaryRuneStyle={secondaryRuneStyle}
                  secondaryTreeLabel={t(($) => $.connected.champSelectRunesSecondaryTree)}
                  selectEditableHintLabel={t(($) => $.connected.champSelectRunesSelectEditableHint)}
                  selectedSecondaryRuneIds={selectedSecondaryRuneIds}
                  statShardsLabel={t(($) => $.connected.champSelectRunesStatShards)}
                  title={t(($) => $.connected.champSelectRunesTitle)}
                />

                {champSelectState?.hasLockedChampion ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
                    <p className='font-semibold text-slate-800'>{t(($) => $.connected.champSelectSkinsTitle)}</p>
                    {skinsForCurrentChampion.length > 0 ? (
                      <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
                        <select
                          className='h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                          onChange={(event) => {
                            setSelectedSkinDraft(event.target.value)
                          }}
                          value={selectedSkinDraft}
                        >
                          {skinsForCurrentChampion.map((skin) => (
                            <option disabled={!skin.owned} key={skin.id} value={skin.id}>
                              {skin.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          className='font-display h-9 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                          disabled={skinUpdatePending || selectedSkinDraft.length === 0}
                          onClick={() => {
                            void selectSkin()
                          }}
                          type='button'
                        >
                          {t(($) => $.connected.champSelectSkinApply)}
                        </Button>
                      </div>
                    ) : (
                      <p className='mt-2 text-sm text-slate-500'>{t(($) => $.connected.champSelectNoSkins)}</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className='mt-2 space-y-3'>
                <p className='text-slate-600'>{t(($) => $.connected.noLobbySnapshot)}</p>
                <p className='text-sm text-slate-600'>{t(($) => $.connected.noLobbyCreateHint)}</p>
                {lobbyQueueOptions.length > 0 ? (
                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <label className='sr-only' htmlFor='queue-id'>
                      {t(($) => $.connected.queueSelectLabel)}
                    </label>
                    <select
                      className='h-10 rounded-xl border border-slate-300 bg-white px-3 text-slate-700'
                      id='queue-id'
                      onChange={(event) => {
                        setSelectedQueueId(event.target.value)
                      }}
                      value={selectedQueueId}
                    >
                      {lobbyQueueOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.description}
                        </option>
                      ))}
                    </select>
                    <Button
                      className='bg-ink font-display text-mist hover:bg-slate h-10 rounded-xl px-4'
                      disabled={lobbyActionPending || !selectedQueueId}
                      onClick={() => {
                        void createLobby()
                      }}
                      type='button'
                    >
                      {t(($) => $.connected.createLobby)}
                    </Button>
                  </div>
                ) : (
                  <p className='text-sm text-slate-500'>{t(($) => $.connected.noQueueOptions)}</p>
                )}
              </div>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.champSelectTitle)}</h3>
            {champSelectState ? (
              <div className='mt-2 grid gap-2 text-slate-700 sm:grid-cols-2'>
                <p>
                  {t(($) => $.connected.champSelectPhaseLabel)}: <span className='font-semibold'>{champSelectState.phase}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectTimeLeftLabel)}:{' '}
                  <span className='font-semibold'>
                    {champSelectState.timeLeftInPhaseMs !== null
                      ? formatSeconds(Math.round(champSelectState.timeLeftInPhaseMs / 1000))
                      : t(($) => $.connected.unknown)}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectMyTeamLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.myTeamCount}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectEnemyTeamLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.theirTeamCount}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectLocalCellLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.localPlayerCellId ?? t(($) => $.connected.unknown)}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectSelectedChampLabel)}:{' '}
                  <span className='font-semibold'>
                    {formatChampionLabel(champSelectState.localPlayerChampionId, championNamesById, t(($) => $.connected.unknown))}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectCurrentActionLabel)}:{' '}
                  <span className='font-semibold'>{champSelectState.currentActionType ?? t(($) => $.connected.unknown)}</span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectYourTurnLabel)}:{' '}
                  <span className='font-semibold'>
                    {champSelectState.isLocalPlayerTurn ? t(($) => $.connected.yes) : t(($) => $.connected.no)}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectActionChampionLabel)}:{' '}
                  <span className='font-semibold'>
                    {formatChampionLabel(champSelectState.currentActionChampionId, championNamesById, t(($) => $.connected.unknown))}
                  </span>
                </p>
                <p>
                  {t(($) => $.connected.champSelectLockedInLabel)}:{' '}
                  <span className='font-semibold'>
                    {champSelectState.hasLockedChampion ? t(($) => $.connected.yes) : t(($) => $.connected.no)}
                  </span>
                </p>

                {champSelectState.isLocalPlayerTurn ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
                    <p className='font-semibold text-slate-800'>
                      {t(($) => $.connected.champSelectActionTitle)}
                    </p>
                    {selectableChampionIds.length > 0 ? (
                      <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
                        <select
                          className='h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800'
                          onChange={(event) => {
                            setChampionSelectionDraft(event.target.value)
                          }}
                          value={championSelectionDraft}
                        >
                          {selectableChampionIds.map((championId) => (
                            <option key={championId} value={championId}>
                              {formatChampionLabel(championId, championNamesById, t(($) => $.connected.unknown))}
                            </option>
                          ))}
                        </select>

                        <Button
                          className='font-display h-9 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                          disabled={championActionPending || championSelectionDraft.length === 0}
                          onClick={() => {
                            void applyChampionSelectionDraft(false)
                          }}
                          type='button'
                        >
                          {t(($) => $.connected.champSelectActionHover)}
                        </Button>
                        <Button
                          className='font-display h-9 rounded-lg bg-emerald-600 px-3 text-white hover:bg-emerald-700'
                          disabled={championActionPending || championSelectionDraft.length === 0}
                          onClick={() => {
                            void applyChampionSelectionDraft(true)
                          }}
                          type='button'
                        >
                          {champSelectState.currentActionType === 'ban'
                            ? t(($) => $.connected.champSelectActionBan)
                            : t(($) => $.connected.champSelectActionLock)}
                        </Button>
                      </div>
                    ) : (
                      <p className='mt-2 text-sm text-slate-500'>{t(($) => $.connected.champSelectNoSelectable)}</p>
                    )}
                  </div>
                ) : null}

                {champSelectState.benchEnabled ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
                    <div className='flex items-center justify-between'>
                      <p className='font-semibold text-slate-800'>{t(($) => $.connected.champSelectRerollTitle)}</p>
                      <Button
                        className='font-display h-8 rounded-lg bg-sky-600 px-3 text-white hover:bg-sky-700'
                        disabled={rerollPending || !rerollPoints || rerollPoints.numberOfRolls < 1}
                        onClick={() => {
                          void rerollChampion()
                        }}
                        type='button'
                      >
                        {t(($) => $.connected.champSelectRerollAction)}
                      </Button>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                      <Trans
                        components={{ value: <span className='font-semibold' /> }}
                        i18nKey={($) => $.connected.champSelectRerollValue}
                        values={{ value: `${rerollPoints?.numberOfRolls ?? 0}/${rerollPoints?.maxRolls ?? 0}` }}
                      />
                    </p>

                    {champSelectState.benchChampionIds.length > 0 ? (
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {champSelectState.benchChampionIds.map((championId) => (
                          <Button
                            className='font-display h-8 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
                            disabled={benchSwapPendingId !== null}
                            key={championId}
                            onClick={() => {
                              void swapBenchChampion(championId)
                            }}
                            type='button'
                          >
                            {formatChampionLabel(championId, championNamesById, t(($) => $.connected.unknown))}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className='mt-2 text-sm text-slate-500'>{t(($) => $.connected.champSelectBenchEmpty)}</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.champSelectNoSession)}</p>
            )}
          </Card>

          <Card className='rounded-2xl border-slate-200 bg-white p-4 sm:col-span-2'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.invites)}</h3>
            {pendingInvites.length > 0 ? (
              <ul className='mt-2 space-y-3'>
                {pendingInvites.map((invite) => {
                  const details = inviteDetailsById[invite.invitationId]
                  const actionPending = inviteActionPendingById[invite.invitationId]

                  return (
                    <li className='rounded-xl border border-slate-200 bg-slate-50 p-3' key={invite.invitationId}>
                      <div className='flex items-start gap-3'>
                        {buildSummonerIconUrl(ddragonVersionValue, details?.profileIconId ?? null) ? (
                          <img
                            alt={details?.summonerName ?? t(($) => $.connected.unknownSummoner)}
                            className='mt-0.5 h-11 w-11 rounded-full border border-slate-200 bg-white object-cover'
                            src={buildSummonerIconUrl(ddragonVersionValue, details?.profileIconId ?? null) ?? undefined}
                          />
                        ) : (
                          <div className='mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500'>
                            ?
                          </div>
                        )}
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-semibold text-slate-800'>
                            {details?.summonerName ?? t(($) => $.connected.unknownSummoner)}
                          </p>
                          <p className='text-sm text-slate-600'>
                            <Trans
                              components={{ value: <span className='font-semibold' /> }}
                              i18nKey={($) => $.connected.inviteDetailsValue}
                              values={{
                                map: details?.mapName ?? t(($) => $.connected.unknown),
                                queue: details?.queueName ?? t(($) => $.connected.unknown),
                              }}
                            />
                          </p>
                        </div>
                      </div>
                      <div className='mt-3 flex gap-2'>
                        <Button
                          className='font-display h-9 rounded-xl bg-emerald-600 px-3 text-white hover:bg-emerald-700'
                          disabled={actionPending || !invite.canAcceptInvitation}
                          onClick={() => {
                            void sendInviteResponse(invite.invitationId, 'accept')
                          }}
                          type='button'
                        >
                          {t(($) => $.connected.inviteAccept)}
                        </Button>
                        <Button
                          className='font-display h-9 rounded-xl bg-rose-600 px-3 text-white hover:bg-rose-700'
                          disabled={actionPending}
                          onClick={() => {
                            void sendInviteResponse(invite.invitationId, 'decline')
                          }}
                          type='button'
                        >
                          {t(($) => $.connected.inviteDecline)}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className='mt-2 text-slate-600'>{t(($) => $.connected.noPendingInvites)}</p>
            )}
          </Card>
        </div>

        {logLines.length > 0 ? (
          <Card className='mt-8 rounded-2xl border-slate-200 bg-white p-4'>
            <h3 className='font-display text-slate text-sm tracking-[0.2em] uppercase'>{t(($) => $.connected.relayPreview)}</h3>
            <ul className='mt-3 space-y-2 text-sm text-slate-700'>
              {logLines.map((line) => (
                <li className='rounded-lg bg-slate-50 px-3 py-2' key={line}>
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {!isStandaloneMode ? (
          <Card className='mt-8 rounded-2xl border-slate-200 bg-white p-4 text-slate-700'>
            <p>{t(($) => $.connected.installPromptBody)}</p>
            {installPromptAvailable ? (
              <Button
                className='bg-ink font-display text-mist hover:bg-slate mt-4 h-11 rounded-2xl px-5'
                onClick={() => {
                  void showInstallPrompt()
                }}
                type='button'
              >
                {t(($) => $.connected.installPromptButton)}
              </Button>
            ) : (
              <p className='mt-3 text-sm text-slate-500'>{t(($) => $.connected.installPromptHint)}</p>
            )}
          </Card>
        ) : null}
      </Card>
    </main>
  )
}
