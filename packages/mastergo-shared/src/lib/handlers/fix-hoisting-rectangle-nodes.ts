import { judgeIsBgStyleRectangle } from '@ui-differ/core'
import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 背景样式上提：把背景矩形 fills + cornerRadius 合并到父节点，然后删除背景矩形
 */
export async function fixHoistingRectangleNodes(data?: { targetNodeId?: string, nodeIdList?: string[] }) {
  const nodeIdList = data?.nodeIdList ?? []
  if (!nodeIdList.length)
    return sendPluginMsgToUI({ type: PluginMessage.HOISTING_RECTANGLE_FIXED, data: { success: false, fixedCount: 0 } })

  let totalFixed = 0
  for (const nodeId of nodeIdList) {
    const node = mg.getNodeById(nodeId) as SceneNode | null
    if (!node || (node.type !== 'RECTANGLE' && node.type !== 'PEN'))
      continue

    const childNode = node as RectangleNode | PenNode
    const parentNode = childNode.parent as SceneNode | null
    if (!parentNode || (parentNode.type !== 'FRAME' && parentNode.type !== 'GROUP'))
      continue

    const parent = parentNode as FrameNode
    if (!judgeIsBgStyleRectangle(childNode, parent))
      continue

    const bgFills = childNode.fills || []
    parent.fills = [...(parent.fills ?? []), ...bgFills]

    if (node.type === 'RECTANGLE') {
      const rectNode = node as RectangleNode
      if (rectNode.cornerRadius !== undefined)
        parent.cornerRadius = rectNode.cornerRadius
      if (rectNode.topLeftRadius !== undefined) {
        parent.topLeftRadius = rectNode.topLeftRadius
      }
      if (rectNode.topRightRadius !== undefined) {
        parent.topRightRadius = rectNode.topRightRadius
      }
      if (rectNode.bottomLeftRadius !== undefined) {
        parent.bottomLeftRadius = rectNode.bottomLeftRadius
      }
      if (rectNode.bottomRightRadius !== undefined) {
        parent.bottomRightRadius = rectNode.bottomRightRadius
      }
    }

    try { childNode.remove() } catch { /* ignore */ }

    totalFixed++
  }

  sendPluginMsgToUI({ type: PluginMessage.HOISTING_RECTANGLE_FIXED, data: { success: true, fixedCount: totalFixed } })
}
