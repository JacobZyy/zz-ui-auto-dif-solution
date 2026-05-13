import chalk from '@alita/chalk'
import { ConfigProvider, theme } from 'antd'
import { enableMapSet } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import './index.css'

(window as any).alitadebug = true
chalk.hello('zz-ui-differ', '0.0.4')

enableMapSet()

const container = document.createElement('div')
container.addEventListener('click', (event) => {
  event.stopPropagation()
})
container.id = 'crxjs-app'
document.body.appendChild(container)

createRoot(container).render(
  <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { zIndexPopupBase: 1000000 } }}>
    <App />
  </ConfigProvider>,
)
