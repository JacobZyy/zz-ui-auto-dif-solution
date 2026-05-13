import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 溢出隐藏修复：裁剪容器中子节点超出容器尺寸时，约束子节点到容器尺寸
 */
export async function fixOverflowHiddenNodes(data?: { targetNodeId?: string, nodeIdList?: string[] }) {
  const nodeIdList = data?.nodeIdList ?? []
  if (!nodeIdList.length)
    return sendPluginMsgToUI({ type: PluginMessage.OVERFLOW_HIDDEN_FIXED, data: { success: false, fixedCount: 0 } })

  let totalFixed = 0
  for (const nodeId of nodeIdList) {
    const node = mg.getNodeById(nodeId) as SceneNode | null
    if (!node || node.type === 'GROUP' || !('children' in node) || !node.children)
      continue

    const frameNode = node as FrameNode
    if (!frameNode.clipsContent)
      continue

    const children = Array.from(frameNode.children)
    let fixed = 0
    for (const child of children) {
      if (!('width' in child) || !('height' in child))
        continue
      const childNode = child as LayoutMixin
      if (childNode.width > frameNode.width) {
        childNode.width = frameNode.width
        fixed++
      }
      if (childNode.height > frameNode.height) {
        childNode.height = frameNode.height
        fixed++
      }
    }
    if (fixed > 0)
      totalFixed++
  }

  sendPluginMsgToUI({ type: PluginMessage.OVERFLOW_HIDDEN_FIXED, data: { success: true, fixedCount: totalFixed } })
}
