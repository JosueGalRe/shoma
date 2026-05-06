import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { RiftClientProvider } from '@/core/rift/rift-client-provider'

import { routeTree } from './routeTree.gen'

import './i18n/config'
import './styles.css'

const queryClient = new QueryClient()
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 30_000,
  defaultStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing root element.')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RiftClientProvider>
        <RouterProvider router={router} />
      </RiftClientProvider>
    </QueryClientProvider>
  </StrictMode>,
)
