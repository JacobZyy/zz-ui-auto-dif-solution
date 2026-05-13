import type { MessageInstance } from 'antd/es/message/interface'
import type { ChromeListenerMessageType, SelectedElementResponseData } from '@/types/message'
import { useMemoizedFn } from 'ahooks'
import { useEffect, useState } from 'react'
import { ChromeMessageType } from '@/types'

interface UseSelectedElementProps {
  messageApi: MessageInstance
  areaDiffCallback: (selector: string) => void
}
/**
 * React Hook: 请求 DevTools 选中的元素
 *
 * @returns requestDevToolsSelection 函数，发起请求但不等待结果
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const requestDevToolsSelection = useSelectedElement()
 *
 *   const handleClick = () => {
 *     requestDevToolsSelection()
 *   }
 *
 *   return <button onClick={handleClick}>Get Element</button>
 * }
 * ```
 */
export function useSelectedElement({ messageApi, areaDiffCallback }: UseSelectedElementProps) {
  const [selectedEle, setSelectorEle] = useState<string>()

  // 消息监听器
  const messageListener = useMemoizedFn((message: ChromeListenerMessageType<SelectedElementResponseData>) => {
    if (message.type !== ChromeMessageType.SELECTED_ELEMENT_RESPONSE || !message.data) {
      return
    }
    const { selector, error } = message.data

    if (error) {
      const errorMsg = 'message' in error ? error.message as string : '元素获取异常'
      setSelectorEle('')
      messageApi.error(errorMsg)
      return
    }

    if (!selector) {
      setSelectorEle('')
      messageApi.error('未选中任何元素，请在 DevTools Elements 面板中选择一个元素')
      return
    }
    setSelectorEle(selector)
    areaDiffCallback(selector)
  })

  // 注册和清理监听器
  useEffect(() => {
    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  // 发起请求的函数
  const requestDevToolsSelection = useMemoizedFn(() => {
    // 发送请求
    chrome.runtime.sendMessage({
      type: ChromeMessageType.GET_SELECTED_ELEMENT,
      data: null,
    })
  })

  return { selectedEle, requestDevToolsSelection }
}
