import type { ChromeListenerMsgProcessorParams, ChromeListenerMsgResponse } from '@/types'
import { ChromeMessageType } from '@/types'
import { devtoolsConnectionManager } from '../devToolsConnector'
/**
 * 处理获取选中元素请求
 * 简化为纯消息转发，不维护状态
 */
export async function getSelectedElement(configs: ChromeListenerMsgProcessorParams): Promise<ChromeListenerMsgResponse> {
  const { sender } = configs
  const tabId = sender.tab?.id
  console.log('🚀 ~ [Background] getSelectedElement ~ 收到请求, tabId:', tabId)

  if (!tabId) {
    console.log('🚀 ~ [Background] getSelectedElement ~ tabId不存在')
    return {
      success: false,
      message: '无法获取标签页ID',
      data: null,
    }
  }

  const devtoolsPort = devtoolsConnectionManager.getPort(tabId)
  console.log('🚀 ~ [Background] getSelectedElement ~ devtoolsPort:', devtoolsPort ? '已连接' : '未连接')

  if (!devtoolsPort) {
    console.log('🚀 ~ [Background] getSelectedElement ~ DevTools未连接')
    return {
      success: false,
      message: '无法获取 DevTools 连接，请确保 DevTools 面板已打开',
      data: null,
    }
  }

  // 直接转发消息给 DevTools，不等待响应
  console.log('🚀 ~ [Background] getSelectedElement ~ 转发请求到DevTools, tabId:', tabId)
  devtoolsPort.postMessage({
    type: ChromeMessageType.GET_ELEMENT_SELECTOR,
    data: { tabId },
  })

  // 立即返回成功，实际响应通过事件返回给 Content Script
  console.log('🚀 ~ [Background] getSelectedElement ~ 请求已转发，返回成功响应')
  return {
    success: true,
    message: '已转发请求到 DevTools',
    data: null,
  }
}
