import { useQuery } from '@tanstack/react-query'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { clashChatRostersDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { readClashTeams } from '../lib/clash-teams'

import { useChatLCU } from './use-chat-lcu'

// The player's Clash teams whose group chat the client joined
export function useClashTeams() {
  const transport = useSharedLCUTransport()
  const { conversations } = useChatLCU(null)
  const rosters = useQuery(createLcuQueryOptions(clashChatRostersDescriptor, transport)).data ?? []

  useLcuObserverSync(clashChatRostersDescriptor, transport)

  return readClashTeams(conversations, rosters)
}
