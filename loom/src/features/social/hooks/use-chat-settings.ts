import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useSaveChatSettings } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { chatSettingsDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { DEFAULT_FRIEND_LIST_SETTINGS } from '../lib/group-friends'

import type { FriendListSettings } from '../lib/group-friends'

// The friend list's order and grouping as the client keeps them, so loom's list and the desktop's match
export function useChatSettings() {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()
  const { data } = useQuery(createLcuQueryOptions(chatSettingsDescriptor, transport))
  const save = useSaveChatSettings()

  useLcuObserverSync(chatSettingsDescriptor, transport)

  return {
    // Only once read: the client writes the whole body, and a partial one would drop its other settings
    canSave: Boolean(data),
    settings: data ?? DEFAULT_FRIEND_LIST_SETTINGS,
    update: (patch: Partial<FriendListSettings>) => {
      if (!data) {
        return
      }

      const next = { ...data, ...patch }

      // Ticks at once instead of after the round trip
      queryClient.setQueryData(chatSettingsDescriptor.queryKey, next)

      save.mutate(next, {
        onError: () => {
          void queryClient.invalidateQueries({ queryKey: chatSettingsDescriptor.queryKey })
        },
      })
    },
  }
}
