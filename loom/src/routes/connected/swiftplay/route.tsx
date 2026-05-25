import { createFileRoute } from '@tanstack/react-router'

import { perksPagesDescriptor, summonerSpellsDescriptor } from '@/core/lcu/lcu-queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'

import { SwiftplayRouteComponent } from './-route-component'

export const Route = createFileRoute('/connected/swiftplay')({
  component: SwiftplayRouteComponent,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [summonerSpellsDescriptor, perksPagesDescriptor])
  },
})
