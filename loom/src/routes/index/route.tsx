import { createFileRoute } from '@tanstack/react-router'

import { IndexRouteComponent } from './-route-component'

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
  validateSearch: (search) => {
    return {
      code: typeof search.code === 'string' ? search.code : undefined,
    }
  },
})
