import { LcuHttpMethod, LcuPaths, type LcuChampSelectMySelectionPatchBody } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { createLCUClient } from '@core/rift/lcu-transport'

export type SkinOwnership = {
  owned: boolean
}

export type ChampionSkin = {
  championId: number
  disabled?: boolean
  id: number
  isBase?: boolean
  name: string
  ownership?: SkinOwnership
  splashPath?: string
}

export type SkinSelectionRequest = (body: LcuChampSelectMySelectionPatchBody) => Promise<void>

export type SkinsStoreState = {
  currentChampion: number | null
  error: Error | null
  ownedSkins: ChampionSkin[]
  selectedSkin: number | null
  skins: ChampionSkin[]
}

export type SkinsStoreActions = {
  reset: () => void
  selectSkin: (id: number, requestSelection?: SkinSelectionRequest) => Promise<boolean>
  setChampion: (id: number | null | undefined) => void
  setSkinData: (data: { selectedSkin?: number | null; skins?: ChampionSkin[] | null }) => void
  setSkinError: (error: unknown) => void
}

export type SkinsStore = SkinsStoreState & SkinsStoreActions

const lcuClient = createLCUClient({ connectOnCreate: false })

export const initialSkinsState: SkinsStoreState = {
  currentChampion: null,
  error: null,
  ownedSkins: [],
  selectedSkin: null,
  skins: [],
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Skin selection operation failed.')
}

function defaultSkinForChampion(championId: number): ChampionSkin {
  return {
    championId,
    id: championId * 1000,
    isBase: true,
    name: 'Default',
    ownership: { owned: true },
  }
}

function isOwnedSkin(skin: ChampionSkin): boolean {
  return skin.isBase === true || skin.ownership?.owned === true
}

function filterOwnedSkins(skins: ChampionSkin[], championId: number | null): ChampionSkin[] {
  if (!championId) {
    return []
  }

  const owned = skins.filter((skin) => skin.championId === championId && !skin.disabled && isOwnedSkin(skin))
  const hasDefault = owned.some((skin) => skin.isBase || skin.id === championId * 1000)
  return hasDefault ? owned : [defaultSkinForChampion(championId), ...owned]
}

async function defaultSelectSkin(body: LcuChampSelectMySelectionPatchBody): Promise<void> {
  const result = await lcuClient.request(LcuPaths.champSelect.mySelection, LcuHttpMethod.PATCH, body)
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${LcuPaths.champSelect.mySelection}`)
  }
}

export function createSkinsStore() {
  return create<SkinsStore>()((set, get) => ({
    ...initialSkinsState,
    reset() {
      set({ ...initialSkinsState })
    },
    async selectSkin(id, requestSelection = defaultSelectSkin) {
      const skin = get().ownedSkins.find((candidate) => candidate.id === id)
      if (!skin) {
        set({ error: new Error('Skin is unavailable for the selected champion.') })
        return false
      }

      try {
        await requestSelection({ selectedSkinId: id })
        set({ error: null, selectedSkin: id })
        return true
      } catch (error) {
        set({ error: normalizeError(error) })
        return false
      }
    },
    setChampion(id) {
      const currentChampion = id && id > 0 ? id : null
      const ownedSkins = filterOwnedSkins(get().skins, currentChampion)
      const selectedSkin = get().selectedSkin && ownedSkins.some((skin) => skin.id === get().selectedSkin) ? get().selectedSkin : (ownedSkins[0]?.id ?? null)

      set({ currentChampion, error: null, ownedSkins, selectedSkin })
    },
    setSkinData(data) {
      set((state) => {
        const skins = data.skins ?? state.skins
        const ownedSkins = filterOwnedSkins(skins, state.currentChampion)
        const requestedSelection = data.selectedSkin === undefined ? state.selectedSkin : data.selectedSkin
        const selectedSkin = state.currentChampion
          ? requestedSelection && ownedSkins.some((skin) => skin.id === requestedSelection)
            ? requestedSelection
            : (ownedSkins[0]?.id ?? null)
          : requestedSelection

        return {
          error: null,
          ownedSkins,
          selectedSkin,
          skins,
        }
      })
    },
    setSkinError(error) {
      set({ error: normalizeError(error) })
    },
  }))
}

export const skinRequestPaths = {
  inventorySkinsMinimal: LcuPaths.champions.inventorySkinsMinimal,
} as const

export const useSkinsStore = createSkinsStore()
