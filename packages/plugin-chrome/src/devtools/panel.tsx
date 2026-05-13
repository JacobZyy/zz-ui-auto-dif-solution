import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './panel.css'

function DevToolsPanel() {
  return (
    <div className="devtools-panel">
      <header className="panel-header">
        <h1>CRXJS DevTools Panel</h1>
        <p className="subtitle">Chrome Extension with React & Vite</p>
      </header>

      <main className="panel-content">
        <section className="info-section">
          <h2>当前检查的页面</h2>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevToolsPanel />
  </StrictMode>,
)
