import type { UIMessage } from '@ui-differ/mastergo-shared/lib'
import { getPreviewImg, sendSelectionToUI, uIMessageRecord } from '@ui-differ/mastergo-shared/lib'
import { enableMapSet } from 'immer'

enableMapSet()
mg.showUI(__html__, {
  width: 480,
  height: 800,
})

// 监听选择变化事件
mg.on('selectionchange', () => {
  sendSelectionToUI()
  getPreviewImg()
})

mg.ui.onmessage = (msg: { type: UIMessage, data: unknown }) => {
  const { type, data } = msg
  const handler = uIMessageRecord[type]
  return handler?.(data)
}
