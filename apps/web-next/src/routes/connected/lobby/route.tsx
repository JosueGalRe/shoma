import { createFileRoute } from '@tanstack/react-router'

import { gameQueuesDescriptor, platformConfigDescriptor } from '@/core/lcu/lcu-queries'
import { ensureLcuRouteData } from '@/core/rift/route-loader'

export const Route = createFileRoute('/connected/lobby')({
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [
      gameQueuesDescriptor,
      platformConfigDescriptor('LcuSocial', 'EnabledGameQueues'),
      platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'),
    ])
  },
})
