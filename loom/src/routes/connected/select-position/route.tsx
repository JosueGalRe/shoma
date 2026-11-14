import { createFileRoute } from '@tanstack/react-router'
import { object, optional, picklist } from 'valibot'

import { lobbySessionDescriptor } from '@/core/lcu/queries'
import { ensureLcuRouteData } from '@/core/relay/route-loader'

import { SelectPositionRouteComponent } from './-route-component'

// The lobby tile that opened the screen: picks land in that slot first
const searchSchema = object({
  slot: optional(picklist(['first', 'second']), 'first'),
})

// eslint-disable-next-line sort-keys -- TanStack Router infers the loader's types from validateSearch, so it goes first
export const Route = createFileRoute('/connected/select-position')({
  component: SelectPositionRouteComponent,
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [lobbySessionDescriptor])
  },
})
