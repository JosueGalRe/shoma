import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  createLcuQueryOptions,
  friendGroupsDescriptor,
  friendsDescriptor,
  type LcuFriendGroupsMap,
  parseLcuFriends,
  useLcuFriendGroups,
} from '@/core/lcu/queries'
import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import type { Friend } from '../social-types'

export interface UseSocialLCUResult {
  error: string | null
  friends: Friend[]
  groups: string[]
  isLoading: boolean
}

const EMPTY_GROUPS_MAP: LcuFriendGroupsMap = {}

function formatSocialError(error: Error | null): string | null {
  return error ? `Unable to load League friends: ${error.message}` : null
}

export function useSocialLCU(): UseSocialLCUResult {
  const { state: relayState } = useSharedRelayClient()
  const transport = useSharedLCUTransport()
  const friendGroupsQuery = useLcuFriendGroups(transport)
  const groupsMap = friendGroupsQuery.data ?? EMPTY_GROUPS_MAP
  const groupsKey = useMemo(() => {
    return JSON.stringify(groupsMap)
  }, [groupsMap])
  const parsedFriendsDescriptor = useMemo(() => {
    return {
      ...friendsDescriptor,
      parse: (content: unknown) => {
        return parseLcuFriends(content, groupsMap)
      },
      queryKey: [...friendsDescriptor.queryKey, 'groups', groupsKey],
    }
  }, [groupsKey, groupsMap])
  const friendsQuery = useQuery(createLcuQueryOptions(parsedFriendsDescriptor, transport))

  useLcuObserverSync(parsedFriendsDescriptor, transport)
  useLcuObserverSync(friendGroupsDescriptor, transport)

  const isConnected = relayState === RelayClientState.CONNECTED

  const friends = isConnected ? (friendsQuery.data ?? []) : []
  const groups = isConnected ? Object.values(friendGroupsQuery.data ?? {}) : []
  const error = isConnected ? formatSocialError(friendsQuery.error ?? friendGroupsQuery.error) : null
  const isLoading =
    isConnected &&
    (friendsQuery.isLoading || friendsQuery.isFetching || friendGroupsQuery.isLoading || friendGroupsQuery.isFetching)

  return {
    error,
    friends,
    groups,
    isLoading,
  }
}
