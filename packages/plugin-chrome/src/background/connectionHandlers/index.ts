import { DevToolsNameEnum } from '@/types'
import { devToolsConnectionHandler } from './devToolsConnectionHandler'

export const PortHandlerMap: Partial<Record<string, (port: chrome.runtime.Port) => void>> = {
  [DevToolsNameEnum.UI_DIFF_PANEL]: devToolsConnectionHandler,
}
