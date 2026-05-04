import type { LCUWebSocketEvents } from '@hasagi/types'

export type { LCUWebSocketEvents } from '@hasagi/types'

export type LcuEventPayload<TEventName extends keyof LCUWebSocketEvents> = LCUWebSocketEvents[TEventName]

export const LcuEventNames = {
  gameflowPhase: 'OnJsonApiEvent_lol-gameflow_v1_gameflow-phase',
  gameflowSession: 'OnJsonApiEvent_lol-gameflow_v1_session',
  lobby: 'OnJsonApiEvent_lol-lobby_v2_lobby',
  champSelectSession: 'OnJsonApiEvent_lol-champ-select_v1_session',
  currentSummoner: 'OnJsonApiEvent_lol-summoner_v1_current-summoner',
  chatMe: 'OnJsonApiEvent_lol-chat_v1_me',
} as const satisfies Record<string, keyof LCUWebSocketEvents>
