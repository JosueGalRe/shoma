import { StrictMode } from 'react'

import { ToastProvider } from '@shoma/ui/toast'
import ReactDOM from 'react-dom/client'

import { UiKitPage } from './ui-kit-page'
// eslint-disable-next-line import/no-unassigned-import -- @font-face rules of the new design system.
import '@shoma/ui/fonts.css'

const rootElement = document.querySelector('#root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <ToastProvider closeLabel="Close">
        <UiKitPage />
      </ToastProvider>
    </StrictMode>,
  )
}
