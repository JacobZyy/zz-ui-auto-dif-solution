import { PluginMessage } from '../message/type'
import { serializeNode } from './node-serialize-utils'

interface RequestPayload {
  requestId: string
  nodeId: string
}

function isRequestPayload(data: unknown): data is RequestPayload {
  return (
    typeof data === 'object'
    && data !== null
    && typeof (data as Record<string, unknown>).requestId === 'string'
    && typeof (data as Record<string, unknown>).nodeId === 'string'
  )
}

/**
 * 根据 requestId + nodeId 查询 MasterGo 节点，序列化后通过 mg.ui.postMessage 发送 NODE_INFO 响应
 * 由 sandbox (lib/main.ts) 在收到 UI 发来的 GET_NODE_INFO 消息时调用
 */
export function getNodeInfo(data: unknown): void {
  if (!isRequestPayload(data)) {
    console.warn('[getNodeInfo] invalid payload')
    return
  }
  const { requestId, nodeId } = data
  const node = mg.getNodeById(nodeId)

  if (!node) {
    mg.ui.postMessage({
      type: PluginMessage.NODE_INFO,
      data: { requestId, error: 'NODE_NOT_FOUND', nodeId },
    })
    return
  }

  // symbol 值（mixed）在 JSON.stringify 时会被丢弃，通过 replacer 转为字符串保留
  const serialized = JSON.parse(
    JSON.stringify(serializeNode(node), (_key, val) => (typeof val === 'symbol' ? 'mixed' : val))
  )

  mg.ui.postMessage({
    type: PluginMessage.NODE_INFO,
    data: { requestId, data: serialized },
  })
}
