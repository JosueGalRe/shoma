import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import {
  createLcuQueryOptions,
  friendGroupsDescriptor,
  friendsDescriptor,
  parseLcuFriends,
  useLcuFriendGroups,
  type LcuFriendGroupsMap,
} from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { RiftClientState } from '@/core/rift/rift-client'
import { useSharedLCUTransport, useSharedRiftClient } from '@/core/rift/rift-client-provider'
import { useCountdown } from '@/hooks/useCountdown'

import { mockFriends, mockSocialGroups, type Friend } from '../social-store'

export type UseSocialLCUResult = {
  error: string | null
  friends: Friend[]
  groups: string[]
  isLoading: boolean
}

const MOCK_FALLBACK_DELAY_MS = 8000
const MOCK_FALLBACK_DELAY_SECONDS = MOCK_FALLBACK_DELAY_MS / 1000
const EMPTY_GROUPS_MAP: LcuFriendGroupsMap = {}

function formatSocialError(error: Error | null): string | null {
  return error ? `Unable to load League friends: ${error.message}` : null
}

export function useSocialLCU(): UseSocialLCUResult {
  const { state: riftState } = useSharedRiftClient()
  const transport = useSharedLCUTransport()
  const friendGroupsQuery = useLcuFriendGroups(transport)
  const groupsMap = friendGroupsQuery.data ?? EMPTY_GROUPS_MAP
  const groupsKey = useMemo(() => JSON.stringify(groupsMap), [groupsMap])
  const parsedFriendsDescriptor = useMemo(
    () => ({
      ...friendsDescriptor,
      queryKey: [...friendsDescriptor.queryKey, 'groups', groupsKey] as const,
      parse: (content: unknown) => parseLcuFriends(content, groupsMap),
    }),
    [groupsKey, groupsMap],
  )
  const friendsQuery = useQuery(createLcuQueryOptions(parsedFriendsDescriptor, transport))

  useLcuObserverSync(parsedFriendsDescriptor, transport)
  useLcuObserverSync(friendGroupsDescriptor, transport)

  const shouldWaitForLcuFriends = riftState === RiftClientState.CONNECTED && !friendsQuery.data
  const fallbackCountdown = useCountdown(shouldWaitForLcuFriends ? MOCK_FALLBACK_DELAY_SECONDS : 0)
  const useMockFallback = shouldWaitForLcuFriends && !fallbackCountdown.isActive

  const friends =
    riftState === RiftClientState.CONNECTED
      ? useMockFallback
        ? mockFriends
        : (friendsQuery.data ?? [])
      : mockFriends

  const groups =
    riftState === RiftClientState.CONNECTED
      ? useMockFallback
        ? mockSocialGroups
        : Object.values(friendGroupsQuery.data ?? {})
      : mockSocialGroups

  const error = riftState === RiftClientState.CONNECTED && !useMockFallback ? formatSocialError(friendsQuery.error ?? friendGroupsQuery.error) : null
  const isLoading =
    riftState === RiftClientState.CONNECTED &&
    !useMockFallback &&
    (friendsQuery.isLoading || friendsQuery.isFetching || friendGroupsQuery.isLoading || friendGroupsQuery.isFetching)

  return {
    error,
    friends,
    groups,
    isLoading,
  }
}
