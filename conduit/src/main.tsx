import { StrictMode } from 'react'

import ReactDOM from 'react-dom/client'

import App, { APP_NAME } from './app'

export { APP_NAME }

function mountApp() {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.getElementById('app')

  if (!root) {
    return
  }

  ReactDOM.createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

mountApp()
