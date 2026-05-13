import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { iconShapeNodeTypeSet, MASK_REPLACE_SUFFIX } from '../types'

function getIsMaskCombineNode(currentNodeInfo: NodeInfo, draftFlatNodeMap: Map<UniqueId, NodeInfo>) {
  const { children } = currentNodeInfo
  if (children.length !== 1) {
    return false
  }
  const childNodeInfo = draftFlatNodeMap.get(children[0])
  if (!childNodeInfo) {
    return false
  }

  const isMaskCombinedNode = childNodeInfo.nodeName.includes(MASK_REPLACE_SUFFIX)
  return isMaskCombinedNode
}

function getIsIconNode(currentNodeInfo: NodeInfo, draftFlatNodeMap: Map<UniqueId, NodeInfo>) {
  const { children } = currentNodeInfo
  const hasOtherShapeNode = children.some((childId) => {
    const childNodeInfo = draftFlatNodeMap.get(childId)
    if (!childNodeInfo?.tagName) {
      return false
    }
    return iconShapeNodeTypeSet.has(childNodeInfo.tagName as SceneNode['type'])
  })
  return hasOtherShapeNode
}

export async function processDesignNodeShouldShrinkBounding(flatNodeMap: Map<UniqueId, NodeInfo>) {
  const newFlatNodeMap = produce(flatNodeMap, (draftFlatNodeMap) => {
    draftFlatNodeMap.forEach((currentNodeInfo) => {
      const isMaskCombinedNode = getIsMaskCombineNode(currentNodeInfo, draftFlatNodeMap)
      const isIconNode = getIsIconNode(currentNodeInfo, draftFlatNodeMap)
      // 当前节点内部只有一个节点，且这个节点的内部是被蒙版组合过的，或者当前节点内部有其他形状节点，那么这个节点的 bounding 就不需要 shrink
      currentNodeInfo.shouldSkipShrinkBounding = isMaskCombinedNode || isIconNode
      // currentNodeInfo.shouldSkipShrinkBounding = false
    })
  })
  return newFlatNodeMap
}
