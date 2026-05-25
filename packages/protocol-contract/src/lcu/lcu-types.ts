export const LcuHttpMethod = {
  DELETE: 'DELETE',
  GET: 'GET',
  PATCH: 'PATCH',
  POST: 'POST',
  PUT: 'PUT',
} as const

export type LcuHttpMethodValue = (typeof LcuHttpMethod)[keyof typeof LcuHttpMethod]

export interface LcuResult<TContent = unknown> {
  status: number
  content: TContent
}

export type LcuObserver<TContent = unknown> = (result: LcuResult<TContent>) => void | Promise<void>

export interface LcuLobbyQueueBody {
  queueId: number
}

export interface LcuLobbyInvitationBody {
  toSummonerId: number
}

export interface LcuLobbyPositionPreferencesBody {
  firstPreference: string
  secondPreference: string
}

export interface LcuQuickplayPlayerSlot {
  championId: number
  perks: string
  positionPreference: string
  skinId: number
  spell1: number
  spell2: number
}

export type LcuQuickplayPlayerSlotsBody = LcuQuickplayPlayerSlot[]

export interface LcuChampSelectMySelectionPatchBody {
  spell1Id?: number
  spell2Id?: number
  selectedSkinId?: number
}

export interface LcuChampSelectActionPatchBody {
  championId: number
  completed?: boolean
}

export interface LcuPerksPageCreateBody {
  name: string
  primaryStyleId: number
  secondaryStyleId: number
  selectedPerkIds: number[]
}

export type LcuPerksPageUpdateBody = Record<string, unknown>
