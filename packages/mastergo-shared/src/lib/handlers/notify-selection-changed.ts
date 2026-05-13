import { PluginMessage } from '../message/type'
import { serializeNode } from './node-serialize-utils'

/** 单调递增 seq，防止乱序更新 */
let selectionSeq = 0

/**
 * 在 selectionchange 时调用，将选中信息发送到 UI iframe (mcp-bridge)
 * 不使用 XHR（sandbox 环境不支持），改为通过 mg.ui.postMessage 中转
 */
export function onSelectionChange(): void {
  const selection = mg.document.currentPage.selection
  const node = selection?.[0]

  if (!node) {
    mg.ui.postMessage({
      type: PluginMessage.SELECTION_FOR_MCP,
      data: null,
      seq: ++selectionSeq,
    })
    return
  }

  // symbol 值（mixed）在 JSON.stringify 时会被丢弃，通过 replacer 转为字符串保留
  const data = JSON.parse(
    JSON.stringify(serializeNode(node), (_key, val) => (typeof val === 'symbol' ? 'mixed' : val))
  )

  mg.ui.postMessage({
    type: PluginMessage.SELECTION_FOR_MCP,
    data,
    seq: ++selectionSeq,
  })
}
