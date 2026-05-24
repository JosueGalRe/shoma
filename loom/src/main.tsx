import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { RelayClientProvider } from '@/core/relay/relay-client-provider'

import { routeTree } from './routeTree.gen'
import './i18n/config'

import './styles.css'

const queryClient = new QueryClient()

if (import.meta.env.DEV) {
  void import('@/core/relay/lcu-mock-dev').then(({ mountLcuMockDev }) => {
    return mountLcuMockDev(queryClient)
  })
}

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  defaultStaleTime: 0,
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
