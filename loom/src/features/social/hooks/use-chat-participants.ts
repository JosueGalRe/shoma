import { useQuery } from '@tanstack/react-query'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { conversationParticipantsDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import type { LcuChatParticipant } from '@/core/lcu/parsers'

const NO_PARTICIPANTS: LcuChatParticipant[] = []

// Who is in a group chat right now, kept live; none without one
export function useChatParticipants(conversationId: string | undefined): LcuChatParticipant[] {
  const transport = useSharedLCUTransport()
  const descriptor = conversationParticipantsDescriptor(conversationId ?? '')
  const { data } = useQuery({ ...createLcuQueryOptions(descriptor, transport), enabled: Boolean(conversationId) })

  useLcuObserverSync(descriptor, conversationId ? transport : null)

  return conversationId ? (data ?? NO_PARTICIPANTS) : NO_PARTICIPANTS
}
