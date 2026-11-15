import { StrictMode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'

import { LiveClientTransportProvider } from '@/core/live-client/live-client-transport-provider'
import { RelayClientProvider } from '@/core/relay/relay-client-provider'

import { i18n } from './i18n/config'
import { routeTree } from './routeTree.gen'
// eslint-disable-next-line import/no-unassigned-import -- @font-face rules of the new design system.
import '@shoma/ui/fonts.css'

// eslint-disable-next-line import/no-unassigned-import -- Vite CSS entrypoint side effect.
import './styles.css'

void i18n

// Images and videos are UI, not something to drag out; a listener because Firefox ignores -webkit-user-drag
document.addEventListener('dragstart', (event) => {
  if (event.target instanceof HTMLImageElement || event.target instanceof HTMLVideoElement) {
    event.preventDefault()
  }
})

const queryClient = new QueryClient()

if (import.meta.env.DEV) {
  void import('@/core/relay/lcu-mock-dev').then(({ mountLcuMockDev }) => {
    return mountLcuMockDev(queryClient)
  })

  // The simulated client (?sim) has to replace the relay socket before the first connection
  const { installSim } = await import('@/sim/install-sim')

  await installSim()
}

export const router = createRouter({
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  defaultStaleTime: 0,
  // A new page cross-fades over the old one (styles.css); the first load and search-only changes (a tab, a picker's
  // Part) don't. Browsers without view transition types fade every navigation
  defaultViewTransition: {
    types: ({ fromLocation, pathChanged }) => {
      return fromLocation && pathChanged ? [] : false
    },
  },
  routeTree,
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing root element.')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RelayClientProvider>
        <LiveClientTransportProvider>
          <RouterProvider router={router} />
        </LiveClientTransportProvider>
      </RelayClientProvider>
    </QueryClientProvider>
  </StrictMode>,
)
