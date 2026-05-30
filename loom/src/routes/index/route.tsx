import { createFileRoute } from '@tanstack/react-router'

import { IndexRouteComponent } from './-route-component'

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
  validateSearch: (search: Record<string, unknown>): { code?: string; variant?: string } => {
    return {
      code: typeof search.code === 'string' ? search.code : undefined,
      variant: typeof search.variant === 'string' ? search.variant : undefined,
    }
  },
})
