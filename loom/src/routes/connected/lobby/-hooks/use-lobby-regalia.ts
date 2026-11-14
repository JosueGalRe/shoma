import { useQueries, useQuery } from '@tanstack/react-query'

import { bannerSkinsDescriptor, createLcuQueryOptions, playerRegaliaDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { getMemberRegalia } from '../-components/lobby-party-utils'

import type { LobbyMemberRegalia } from '../-components/lobby-screen-types'
import type { SummonerId } from '@/core/types/branded'
import type { LobbyMember } from '@/features/lobby/lobby-store'

// Each member's banner, border and tokens: one challenges summary per player, plus the banners' art from game data
export function useLobbyRegalia(members: LobbyMember[]): Map<SummonerId, LobbyMemberRegalia> {
  const transport = useSharedLCUTransport()
  const bannerSkinsQuery = useQuery(createLcuQueryOptions(bannerSkinsDescriptor, transport))
  const regaliaQueries = useQueries({
    queries: members.map((member) => {
      return {
        ...createLcuQueryOptions(playerRegaliaDescriptor(member.puuid ?? ''), transport),
        enabled: Boolean(transport && member.puuid),
      }
    }),
  })

  return new Map(
    members.map((member, index) => {
      return [member.summonerId, getMemberRegalia(regaliaQueries[index]?.data, bannerSkinsQuery.data)] as const
    }),
  )
}
