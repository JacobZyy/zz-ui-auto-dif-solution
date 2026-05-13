import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 溢出隐藏检测：遍历整棵树，收集所有 clipsContent=true 且子节点超出尺寸的容器
 */
export function getOverflowHiddenNodes(data?: { targetNodeId?: string }) {
  const targetNodeId = data?.targetNodeId || mg.document.currentPage.selection[0]?.id
  if (!targetNodeId)
    return sendPluginMsgToUI({ type: PluginMessage.OVERFLOW_HIDDEN_NODES, data: { success: false, nodes: [] } })

  const targetNode = mg.getNodeById(targetNodeId)
  if (!targetNode)
    return sendPluginMsgToUI({ type: PluginMessage.OVERFLOW_HIDDEN_NODES, data: { success: false, nodes: [] } })

  const result: { nodeId: string, nodeName: string, description: string }[] = []
  const queue: SceneNode[] = [targetNode]

  while (queue.length > 0) {
    const node = queue.shift()
    if (!node)
      continue

    if ((node.type === 'FRAME') && node.clipsContent && node.children) {
      const childList = Array.from(node.children)
      const overflowCount = childList.filter((child) => {
        const childWidth = (child as LayoutMixin).width ?? (child.absoluteBoundingBox?.width ?? 0)
        const childHeight = (child as LayoutMixin).height ?? (child.absoluteBoundingBox?.height ?? 0)
        return childWidth > node.width || childHeight > node.height
      }).length

      if (overflowCount > 0) {
        result.push({
          nodeId: node.id,
          nodeName: node.name,
          description: `裁剪容器，子节点超出 ${overflowCount} 个`,
        })
      }
    }

    if ('children' in node && node.children) {
      Array.from(node.children).forEach(child => queue.push(child))
    }
  }

  sendPluginMsgToUI({ type: PluginMessage.OVERFLOW_HIDDEN_NODES, data: { success: true, nodes: result } })
}
