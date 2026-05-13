import { useMemoizedFn } from 'ahooks'
import { FloatButton } from 'antd'
import React, { useEffect, useState } from 'react'
import { ChromeMessageType } from '@/types'
import DevToolsConnection from '../components/dev-tools-connection'
import DomInfoGetter from '../components/dom-info-getter'
import '@/content/icon.css'

const App: React.FC = () => {
  const [isUiDifferOpen, setIsUiDifferOpen] = useState<boolean>(false)

  /** 初始化插件展示状态 */
  const handleInitialPluginStatus = async () => {
    // 通过消息通信从 background 获取状态（会话结束后自动清除，默认为 false）
    const response = await chrome.runtime.sendMessage({
      type: ChromeMessageType.GET_PLUGIN_VISIBLE_STATUS,
    })
    setIsUiDifferOpen(!!response?.data)
  }

  const onPluginStatusChange = useMemoizedFn((message, _sender, sendResponse) => {
    if (message.type !== ChromeMessageType.SET_CONTENT_SCRIPT_VISIBLE) {
      return
    }
    const newVisible = message.data ?? !isUiDifferOpen
    setIsUiDifferOpen(newVisible)
    sendResponse({ success: true, message: '已接收开关消息' })
  })

  useEffect(() => {
    handleInitialPluginStatus()
    // 监听开关消息
    chrome.runtime.onMessage.addListener(onPluginStatusChange)
    return () => {
      chrome.runtime.onMessage.removeListener(onPluginStatusChange)
    }
  }, [])

  return isUiDifferOpen && (
    <FloatButton.Group shape="circle" styles={{ itemIcon: { fontSize: '20px' } }}>
      <DevToolsConnection />
      <DomInfoGetter />
    </FloatButton.Group>
  )
}

export default App
