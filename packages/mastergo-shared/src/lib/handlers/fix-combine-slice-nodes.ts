import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 切图修复：把非 SLICE 的兄弟节点设为不可见
 */
export async function fixCombineSliceNodes(data?: { targetNodeId?: string, nodeIdList?: string[] }) {
  const nodeIdList = data?.nodeIdList ?? []
  if (!nodeIdList.length)
    return sendPluginMsgToUI({ type: PluginMessage.COMBINE_SLICE_FIXED, data: { success: false, fixedCount: 0 } })

  let totalFixed = 0
  for (const nodeId of nodeIdList) {
    const node = mg.getNodeById(nodeId) as SceneNode | null
    if (!node || !('children' in node) || !node.children)
      continue

    const children = Array.from(node.children)
    const hasSlice = children.some(c => c.type === 'SLICE')
    if (!hasSlice)
      continue

    let fixed = 0
    for (const child of children) {
      if (child.type !== 'SLICE' && child.isVisible) {
        child.isVisible = false
        fixed++
      }
    }
    if (fixed > 0)
      totalFixed++
  }

  sendPluginMsgToUI({ type: PluginMessage.COMBINE_SLICE_FIXED, data: { success: true, fixedCount: totalFixed } })
}
