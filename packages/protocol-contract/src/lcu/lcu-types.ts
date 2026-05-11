export const LcuHttpMethod = {
  DELETE: 'DELETE',
  GET: 'GET',
  PATCH: 'PATCH',
  POST: 'POST',
  PUT: 'PUT',
} as const

export type LcuHttpMethodValue = (typeof LcuHttpMethod)[keyof typeof LcuHttpMethod]

export type LcuResult<TContent = unknown> = {
  status: number
  content: TContent
}

export type LcuObserver<TContent = unknown> = (result: LcuResult<TContent>) => void | Promise<void>

export type LcuLobbyQueueBody = {
  queueId: number
}

export type LcuLobbyInvitationBody = {
  toSummonerId: number
}

export type LcuLobbyPositionPreferencesBody = {
  firstPreference: string
  secondPreference: string
}

export type LcuQuickplayPlayerSlot = {
  championId: number
  perks: string
  positionPreference: string
  skinId: number
  spell1: number
  spell2: number
}

export type LcuQuickplayPlayerSlotsBody = LcuQuickplayPlayerSlot[]

export type LcuChampSelectMySelectionPatchBody = {
  spell1Id?: number
  spell2Id?: number
  selectedSkinId?: number
}

export type LcuChampSelectActionPatchBody = {
  championId: number
  completed?: boolean
}

export type LcuPerksPageCreateBody = {
  name: string
  primaryStyleId: number
  secondaryStyleId: number
  selectedPerkIds: number[]
}

export type LcuPerksPageUpdateBody = Record<string, unknown>
