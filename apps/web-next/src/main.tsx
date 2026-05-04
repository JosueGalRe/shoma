import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import './i18n/config'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing root element.')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <div>Hello Mimic</div>
  </StrictMode>,
)
