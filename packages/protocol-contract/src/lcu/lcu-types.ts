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

// POST /lol-lobby/v2/lobby for a custom game, the practice tool included: the queue id is the custom queue (3140 for practice)
export interface LcuLobbyCustomBody {
  customGameLobby: {
    configuration: {
      // An ARAM map skin, the gameMutator of a /lol-maps entry; '' for the random map
      aramMapMutator?: string
      gameMode: string
      gameMutator?: string
      gameServerRegion?: string
      mapId: number
      // The queue's gameTypeConfig id: the pick strategy (blind, draft, ...)
      mutators: { id: number }
      spectatorDelayEnabled?: boolean
      spectatorPolicy: 'AllAllowed' | 'FriendsAllowed' | 'LobbyAllowed' | 'NotAllowed'
      teamSize: number
    }
    lobbyName: string
    lobbyPassword: string
  }
  isCustom: true
  queueId: number
}

export interface LcuLobbyInvitationBody {
  toSummonerId: number
}

export interface LcuLobbyPositionPreferencesBody {
  firstPreference: string
  secondPreference: string
  // Queues that rank all five positions (Jade ranked) send the rest too
  thirdPreference?: string
  fourthPreference?: string
  fifthPreference?: string
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
