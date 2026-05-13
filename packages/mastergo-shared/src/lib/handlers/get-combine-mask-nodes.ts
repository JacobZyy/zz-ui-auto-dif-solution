import { nodeCanBeMaskSet } from '@ui-differ/core'
import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 蒙版检测：遍历整棵树，收集所有包含可见 mask 节点的 GROUP/FRAME
 */
export function getCombineMaskNodes(data?: { targetNodeId?: string }) {
  const targetNodeId = data?.targetNodeId || mg.document.currentPage.selection[0]?.id
  if (!targetNodeId)
    return sendPluginMsgToUI({ type: PluginMessage.COMBINE_MASK_NODES, data: { success: false, nodes: [] } })

  const targetNode = mg.getNodeById(targetNodeId)
  if (!targetNode)
    return sendPluginMsgToUI({ type: PluginMessage.COMBINE_MASK_NODES, data: { success: false, nodes: [] } })

  const result: { nodeId: string, nodeName: string, description: string }[] = []
  const queue: SceneNode[] = [targetNode]

  while (queue.length > 0) {
    const node = queue.shift()
    if (!node)
      continue

    if ((node.type === 'GROUP' || node.type === 'FRAME') && node.children) {
      const childList = Array.from(node.children)
      const visibleMaskCount = childList.filter(
        child => child.isVisible && nodeCanBeMaskSet.has(child.type) && (child as BlendMixin).isMask,
      ).length
      if (visibleMaskCount > 0) {
        result.push({
          nodeId: node.id,
          nodeName: node.name,
          description: `包含 ${visibleMaskCount} 个可见蒙版节点`,
        })
      }
      childList.forEach(child => queue.push(child))
    }
  }

  sendPluginMsgToUI({ type: PluginMessage.COMBINE_MASK_NODES, data: { success: true, nodes: result } })
}
