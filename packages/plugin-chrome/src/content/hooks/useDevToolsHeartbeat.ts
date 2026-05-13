import type { ChromeListenerMessageType } from '@/types/message'
import { useInterval, useMemoizedFn } from 'ahooks'
import { useEffect, useState } from 'react'
import { ChromeMessageType } from '@/types'

export function useDevToolsHeartbeat() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected')

  // 监听状态更新消息
  const messageListener = useMemoizedFn((message: ChromeListenerMessageType) => {
    if (message.type === ChromeMessageType.DEVTOOLS_STATUS_UPDATE) {
      setConnectionStatus(message.data.status)
    }
  })

  // 定时轮询状态 (每5秒)
  useInterval(() => {
    chrome.runtime.sendMessage({
      type: ChromeMessageType.GET_DEVTOOLS_STATUS,
    }, (response) => {
      if (response && response.success && response.data) {
        setConnectionStatus(response.data.status)
      }
    })
  }, 15000, { immediate: true })

  useEffect(() => {
    // 注册消息监听
    chrome.runtime.onMessage.addListener(messageListener)
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  return { connectionStatus }
}
