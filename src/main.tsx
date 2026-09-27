import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

document.title = 'CodeForge — Cloud Code Editor & Compiler'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
