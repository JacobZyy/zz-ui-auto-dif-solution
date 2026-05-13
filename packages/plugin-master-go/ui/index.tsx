import { enableMapSet } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'
// @ts-expect-error css没有类型
import 'reset-css'

enableMapSet()
createRoot(document.getElementById('root')!).render(
  <App />,
)
