import { useEffect, useMemo } from 'react'

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
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'

import { useSocialStore } from '../social-store'

const MOCK_FALLBACK_DELAY_MS = 8000
const EMPTY_GROUPS_MAP: LcuFriendGroupsMap = {}

function formatSocialError(error: Error | null): string | null {
  return error ? `Unable to load League friends: ${error.message}` : null
}

export function useSocialLCU() {
  const code = useRiftStore((state) => state.code)
  const riftStatus = useRiftStore((state) => state.status)
  const hydrateFromLcu = useSocialStore((state) => state.hydrateFromLcu)
  const resetToMockData = useSocialStore((state) => state.resetToMockData)
  const setError = useSocialStore((state) => state.setError)
  const setLoading = useSocialStore((state) => state.setLoading)
  const clientOptions = useMemo(
    () => ({
      code,
      enabled: code.length > 0 && riftStatus === 'connected',
    }),
    [code, riftStatus],
  )
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)
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

  useEffect(() => {
    if (riftStatus === 'disconnected') {
      resetToMockData()
      return
    }

    if (!transport || riftStatus !== 'connected') {
      setLoading(riftStatus !== 'error')
      return
    }

    setLoading(
      friendsQuery.isLoading ||
        friendsQuery.isFetching ||
        (friendGroupsQuery.data === undefined && (friendGroupsQuery.isLoading || friendGroupsQuery.isFetching)),
    )
  }, [
    friendGroupsQuery.data,
    friendGroupsQuery.isFetching,
    friendGroupsQuery.isLoading,
    friendsQuery.isFetching,
    friendsQuery.isLoading,
    resetToMockData,
    riftStatus,
    setLoading,
    transport,
  ])

  useEffect(() => {
    if (!transport || riftStatus !== 'connected' || friendsQuery.data) {
      return undefined
    }

    const fallbackTimer = window.setTimeout(() => {
      resetToMockData()
    }, MOCK_FALLBACK_DELAY_MS)

    return () => window.clearTimeout(fallbackTimer)
  }, [friendsQuery.data, resetToMockData, riftStatus, transport])

  useEffect(() => {
    if (!transport || riftStatus !== 'connected' || !friendsQuery.data) {
      return
    }

    hydrateFromLcu(friendsQuery.data)
    setLoading(false)
  }, [friendsQuery.data, hydrateFromLcu, riftStatus, setLoading, transport])

  useEffect(() => {
    if (!transport || riftStatus !== 'connected') {
      return
    }

    const nextError = formatSocialError(friendsQuery.error ?? friendGroupsQuery.error)
    setError(nextError)
    if (nextError) {
      setLoading(false)
    }
  }, [friendGroupsQuery.error, friendsQuery.error, riftStatus, setError, setLoading, transport])

  return {
    error: formatSocialError(friendsQuery.error ?? friendGroupsQuery.error),
    isLoading:
      Boolean(transport) &&
      (friendsQuery.isLoading || friendsQuery.isFetching || friendGroupsQuery.isLoading || friendGroupsQuery.isFetching),
  }
}
