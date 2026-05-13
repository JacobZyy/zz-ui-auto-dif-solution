import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 切图层检测：遍历整棵树，收集所有包含 SLICE 节点的 GROUP/FRAME
 */
export function getCombineSliceNodes(data?: { targetNodeId?: string }) {
  const targetNodeId = data?.targetNodeId || mg.document.currentPage.selection[0]?.id
  if (!targetNodeId)
    return sendPluginMsgToUI({ type: PluginMessage.COMBINE_SLICE_NODES, data: { success: false, nodes: [] } })

  const targetNode = mg.getNodeById(targetNodeId)
  if (!targetNode)
    return sendPluginMsgToUI({ type: PluginMessage.COMBINE_SLICE_NODES, data: { success: false, nodes: [] } })

  const result: { nodeId: string, nodeName: string, description: string }[] = []
  const queue: SceneNode[] = [targetNode]

  while (queue.length > 0) {
    const node = queue.shift()
    if (!node)
      continue

    if ((node.type === 'GROUP' || node.type === 'FRAME') && node.children) {
      const childList = Array.from(node.children)
      const sliceCount = childList.filter(c => c.type === 'SLICE').length
      if (sliceCount > 0) {
        result.push({
          nodeId: node.id,
          nodeName: node.name,
          description: `包含 ${sliceCount} 个切图节点`,
        })
      }
      childList.forEach(child => queue.push(child))
    }
  }

  sendPluginMsgToUI({ type: PluginMessage.COMBINE_SLICE_NODES, data: { success: true, nodes: result } })
}
