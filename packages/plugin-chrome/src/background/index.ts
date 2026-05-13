import { ChromeMessageType, UI_DIFFER_VISIBLE_STORAGE } from '@/types'
import { PortHandlerMap } from './connectionHandlers'
import { handleContentMessage } from './messageHandlers'

/** 监听插件图标点击事件 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id)
    return
  try {
    // 获取当前状态（使用 session 存储，会话结束后自动清除）
    const result = await chrome.storage.session.get(UI_DIFFER_VISIBLE_STORAGE)
    const newVisible = !result[UI_DIFFER_VISIBLE_STORAGE]

    // 保存新状态到会话存储
    await chrome.storage.session.set({ [UI_DIFFER_VISIBLE_STORAGE]: newVisible })
    // 向当前标签页的 content script 发送消息
    await chrome.tabs.sendMessage(tab.id, {
      type: ChromeMessageType.SET_CONTENT_SCRIPT_VISIBLE,
      data: newVisible,
    })
    console.log('✅ 已发送开关消息到 content script，新状态:', newVisible)
  }
  catch (error) {
    console.error('❌ background发送消息失败:', error)
  }
})

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleContentMessage(message, sender, sendResponse)
  return true
})

// 监听来自 DevTools 的连接
chrome.runtime.onConnect.addListener((port) => {
  const handler = PortHandlerMap[port.name]
  return handler?.(port)
})
