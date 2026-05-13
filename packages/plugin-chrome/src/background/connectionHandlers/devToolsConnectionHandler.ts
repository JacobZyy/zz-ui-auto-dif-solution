import type { SelectedElementResponseData } from '@/types/message'
import { ChromeMessageType } from '@/types'
import { devtoolsConnectionManager } from '../devToolsConnector'

function returnElementSelectorHandler(data: SelectedElementResponseData) {
  const { tabId, selector, error } = data
  // 直接发送消息给对应标签页的 Content Script
  console.log('🚀 ~ [devtools] returnElementSelectorHandler ~ 转发到Content Script, tabId:', tabId)
  chrome.tabs.sendMessage(tabId, {
    type: ChromeMessageType.SELECTED_ELEMENT_RESPONSE,
    data: { selector, error },
  })
}

function portRegisterHandler(data: { tabId: number, port: chrome.runtime.Port }) {
  const { tabId, port } = data
  devtoolsConnectionManager.register(tabId, port)
  console.log('✅ DevTools 已注册, tabId:', tabId)

  // 通知 Content Script 连接已建立
  chrome.tabs.sendMessage(tabId, {
    type: ChromeMessageType.DEVTOOLS_STATUS_UPDATE,
    data: { status: 'connected' },
  }).catch(() => {
    // 忽略发送失败（可能是 Content Script 未就绪）
  })
}

export function devToolsConnectionHandler(port: chrome.runtime.Port) {
  port.onMessage.addListener((message) => {
    const { data, type } = message
    // 注册 DevTools 连接
    if (type === ChromeMessageType.PORT_REGISTER) {
      portRegisterHandler({ tabId: data, port })
    }

    // 处理 DevTools 返回的 selector，直接转发给 Content Script
    if (type === ChromeMessageType.RETURN_ELEMENT_SELECTOR) {
      return returnElementSelectorHandler(data)
    }

    // 处理心跳
    if (type === ChromeMessageType.HEARTBEAT) {
      // 保持连接活跃，无需额外处理
      console.log('❤️ 收到 DevTools 心跳')
    }
  })

  port.onDisconnect.addListener(() => {
    console.log('⚠️ DevTools 已断开:', port.name)
    // 查找对应的 tabId 并通知 Content Script
    const connectedTabs = devtoolsConnectionManager.getAllConnectedTabs()
    // 由于 port 还没有从 manager 中移除，我们可以通过遍历找到它
    // 但是 removeByPort 会移除它，我们需要先找到对应的 tabId
    // DevtoolsConnectionManager 需要暴露一个方法或者我们先遍历

    // 实际上 devtoolsConnectionManager.removeByPort 内部知道 tabId，
    // 我们应该修改 devtoolsConnectionManager 或者在 removeByPort 之前找到 tabId
    // 这里简单处理：devToolsConnectionManager 没有直接暴露通过 port 找 tabId 的方法，
    // 但 removeByPort 是通过遍历 values 实现的。

    // 让我们先修改一下 removeByPort 的逻辑或者在这里遍历
    // 为了简单，我们可以在 portRegisterHandler 里把 tabId 挂在 port 对象上?
    // 或者直接在 devtoolsConnectionManager 里增加通知逻辑?
    // 为了保持解耦，我们在 removeByPort 之前手动遍历一下

    let targetTabId: number | undefined
    for (const tabId of connectedTabs) {
      if (devtoolsConnectionManager.getPort(tabId) === port) {
        targetTabId = tabId
        break
      }
    }

    devtoolsConnectionManager.removeByPort(port)

    if (targetTabId) {
      chrome.tabs.sendMessage(targetTabId, {
        type: ChromeMessageType.DEVTOOLS_STATUS_UPDATE,
        data: { status: 'disconnected' },
      }).catch(() => {})
    }
  })
}
