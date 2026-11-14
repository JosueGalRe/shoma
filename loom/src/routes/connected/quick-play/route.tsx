import { createFileRoute } from '@tanstack/react-router'
import { object, optional, picklist } from 'valibot'

import { lobbySessionDescriptor } from '@/core/lcu/queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'
import { QUICK_PLAY_PARTS } from '@/features/lobby/utils/quick-play-slots'

import { QuickPlayRouteComponent } from './-route-component'

// The lobby place that opened the screen: which of the two options, and which part of it
const searchSchema = object({
  option: optional(picklist([0, 1]), 0),
  part: optional(picklist(QUICK_PLAY_PARTS), 'champion'),
})

// eslint-disable-next-line sort-keys -- TanStack Router infers the loader's types from validateSearch, so it goes first
export const Route = createFileRoute('/connected/quick-play')({
  component: QuickPlayRouteComponent,
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [lobbySessionDescriptor])
  },
})
