import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import {
  createLcuQueryOptions,
  friendGroupsDescriptor,
  friendsDescriptor,
  type LcuFriendGroup,
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

const EMPTY_GROUPS: LcuFriendGroup[] = []

function formatSocialError(error: Error | null): string | null {
  return error ? `Unable to load League friends: ${error.message}` : null
}

export function useSocialLCU(): UseSocialLCUResult {
  const { state: relayState } = useSharedRelayClient()
  const transport = useSharedLCUTransport()
  const friendGroupsQuery = useLcuFriendGroups(transport)
  const folders = friendGroupsQuery.data ?? EMPTY_GROUPS
  const groupsKey = useMemo(() => {
    return JSON.stringify(folders)
  }, [folders])
  const parsedFriendsDescriptor = useMemo(() => {
    return {
      ...friendsDescriptor,
      parse: (content: unknown) => {
        return parseLcuFriends(content, folders)
      },
      queryKey: [...friendsDescriptor.queryKey, 'groups', groupsKey],
    }
  }, [folders, groupsKey])
  const friendsQuery = useQuery(createLcuQueryOptions(parsedFriendsDescriptor, transport))

  useLcuObserverSync(parsedFriendsDescriptor, transport)
  useLcuObserverSync(friendGroupsDescriptor, transport)

  const isConnected = relayState === RelayClientState.CONNECTED

  const friends = isConnected ? (friendsQuery.data ?? []) : []
  const groups = isConnected
    ? folders.map(({ name }) => {
        return name
      })
    : []
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
