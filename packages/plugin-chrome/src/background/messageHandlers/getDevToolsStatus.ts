import type { ChromeListenerMsgProcessorParams, ChromeListenerMsgResponse } from '@/types'
import { devtoolsConnectionManager } from '../devToolsConnector'

export async function getDevToolsStatus(configs: ChromeListenerMsgProcessorParams): Promise<ChromeListenerMsgResponse> {
  const { sender } = configs
  const tabId = sender.tab?.id

  if (!tabId) {
    return {
      success: false,
      message: '无法获取标签页ID',
      data: { status: 'disconnected' },
    }
  }

  const port = devtoolsConnectionManager.getPort(tabId)
  const status = port ? 'connected' : 'disconnected'

  return {
    success: true,
    message: '获取状态成功',
    data: { status },
  }
}
