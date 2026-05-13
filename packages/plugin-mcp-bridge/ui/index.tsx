import { ConfigProvider, theme } from 'antd'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
    <App />
  </ConfigProvider>,
)
