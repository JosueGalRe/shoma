import { createFileRoute } from '@tanstack/react-router'

import { perksPagesDescriptor, summonerSpellsDescriptor } from '@/core/lcu/lcu-queries'
import { ensureLcuRouteData } from '@/core/rift/route-loader'

export const Route = createFileRoute('/connected/swiftplay')({
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      summonerSpellsDescriptor,
      perksPagesDescriptor,
    ])
  },
})
