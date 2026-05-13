import { nodeCanBeMaskSet } from '@ui-differ/core'
import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 蒙版修复：对每个包含可见 mask 的节点，取消 mask 语义并用承接 frame 包裹
 */
export async function fixCombineMaskNodes(data?: { targetNodeId?: string, nodeIdList?: string[] }) {
  const nodeIdList = data?.nodeIdList ?? []
  if (!nodeIdList.length)
    return sendPluginMsgToUI({ type: PluginMessage.COMBINE_MASK_FIXED, data: { success: false, fixedCount: 0 } })

  let totalFixed = 0
  for (const nodeId of nodeIdList) {
    const node = mg.getNodeById(nodeId) as SceneNode | null
    if (!node || !('children' in node) || !node.children)
      continue

    const children = Array.from(node.children)
    const maskIndexList: number[] = []
    children.forEach((child, idx) => {
      if (child.isVisible && nodeCanBeMaskSet.has(child.type) && (child as BlendMixin).isMask) {
        maskIndexList.push(idx)
      }
    })

    if (!maskIndexList.length)
      continue

    const sortedIndices = [...maskIndexList].sort((a, b) => b - a)
    for (const maskIdx of sortedIndices) {
      const maskNode = children[maskIdx] as SceneNode

      try { (maskNode as BlendMixin).isMask = false } catch { /* ignore */ }

      const nextMaskIdx = sortedIndices.find(i => i < maskIdx) ?? -1
      const start = maskIdx + 1
      const end = nextMaskIdx > 0 ? nextMaskIdx : children.length

      const frame = mg.createFrame()
      frame.name = `${maskNode.name || 'mask'}-容器`
      frame.clipsContent = true
      frame.flexMode = 'NONE'
      frame.flexWrap = 'NO_WRAP'

      if (maskNode.x !== undefined) frame.x = maskNode.x
      if (maskNode.y !== undefined) frame.y = maskNode.y
      if (maskNode.width !== undefined) frame.width = maskNode.width
      if (maskNode.height !== undefined) frame.height = maskNode.height
      if ((maskNode as LayoutMixin).absoluteTransform) {
        frame.absoluteTransform = (maskNode as LayoutMixin).absoluteTransform
      }

      try { frame.appendChild(maskNode) } catch { /* ignore */ }

      for (let i = start; i < end && i < children.length; i++) {
        const sibling = children[i]
        try { frame.appendChild(sibling) } catch { /* ignore */ }
      }

      if ('appendChild' in node) {
        try { (node as ChildrenMixin<SceneNode>).appendChild(frame) } catch { /* ignore */ }
      }
    }

    totalFixed++
  }

  sendPluginMsgToUI({ type: PluginMessage.COMBINE_MASK_FIXED, data: { success: true, fixedCount: totalFixed } })
}
