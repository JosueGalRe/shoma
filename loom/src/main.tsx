import { StrictMode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import ReactDOM from 'react-dom/client'

import { RelayClientProvider } from '@/core/relay/relay-client-provider'

import { i18n } from './i18n/config'
import { routeTree } from './routeTree.gen'
// eslint-disable-next-line import/no-unassigned-import -- Vite CSS entrypoint side effect.
import './styles.css'

void i18n

const queryClient = new QueryClient()

if (import.meta.env.DEV) {
  void import('@/core/relay/lcu-mock-dev').then(({ mountLcuMockDev }) => {
    return mountLcuMockDev(queryClient)
  })
}

export const router = createRouter({
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  defaultStaleTime: 0,
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
        <RouterProvider router={router} />
      </RelayClientProvider>
    </QueryClientProvider>
  </StrictMode>,
)
