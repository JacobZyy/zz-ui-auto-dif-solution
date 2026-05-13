import { judgeIsBgStyleRectangle } from '@ui-differ/core'
import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 背景样式上提检测：遍历整棵树，收集所有包含与父节点等尺寸背景矩形的 GROUP/FRAME
 */
export function getHoistingRectangleNodes(data?: { targetNodeId?: string }) {
  const targetNodeId = data?.targetNodeId || mg.document.currentPage.selection[0]?.id
  if (!targetNodeId)
    return sendPluginMsgToUI({ type: PluginMessage.HOISTING_RECTANGLE_NODES, data: { success: false, nodes: [] } })

  const targetNode = mg.getNodeById(targetNodeId)
  if (!targetNode)
    return sendPluginMsgToUI({ type: PluginMessage.HOISTING_RECTANGLE_NODES, data: { success: false, nodes: [] } })

  const result: { nodeId: string, nodeName: string, description: string }[] = []
  const queue: SceneNode[] = [targetNode]

  while (queue.length > 0) {
    const node = queue.shift()
    if (!node)
      continue

    if ((node.type === 'GROUP' || node.type === 'FRAME') && node.children) {
      const childList = Array.from(node.children)
      const bgRectCount = childList.filter(
        child => (child.type === 'RECTANGLE' || child.type === 'PEN') && judgeIsBgStyleRectangle(child, node),
      ).length
      if (bgRectCount > 0) {
        result.push({
          nodeId: node.id,
          nodeName: node.name,
          description: `包含 ${bgRectCount} 个背景样式矩形`,
        })
      }
      childList.forEach(child => queue.push(child))
    }
  }

  sendPluginMsgToUI({ type: PluginMessage.HOISTING_RECTANGLE_NODES, data: { success: true, nodes: result } })
}
