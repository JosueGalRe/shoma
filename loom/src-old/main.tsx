import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { initializeWebRuntime } from './core/platform/web-runtime'
import { queryClient } from './core/query/query-client'
import { routeTree } from './routeTree.gen'
import './i18n/config'
import './styles.css'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

export type AppRouter = typeof router

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing root element.')
}

initializeWebRuntime()

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
