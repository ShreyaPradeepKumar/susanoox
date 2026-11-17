import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const dataMode =
  import.meta.env.DEV && import.meta.env.MODE === 'mock' ? 'api' : 'browser'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App dataMode={dataMode} />
  </StrictMode>,
)
