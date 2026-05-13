import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { shouldSkipShrinkBoundingTagNameSet } from '../types'

/**
 * 处理flex节点
 * @param nodeInfo 当前节点
 * @param flatNodeMap 扁平化节点map
 * @returns
 */
function processRowFlexNode(nodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const { children, nodeFlexInfo } = nodeInfo
  const childNodeList = children.map(it => flatNodeMap.get(it)).filter(it => it !== undefined)
  if (!childNodeList.length) {
    return []
  }
  const { flexWrap } = nodeFlexInfo || {}
  const childY = Array.from(new Set(childNodeList.map(it => it.boundingRect.y)))
  const childWidth = Array.from(new Set(childNodeList.map(it => it.boundingRect.width)))
  const childHeight = Array.from(new Set(childNodeList.map(it => it.boundingRect.height)))

  const isChildSameSize = childWidth.length === 1 && childHeight.length === 1

  if (flexWrap === 'nowrap' && childY.length === 1 && childNodeList.length >= 2 && isChildSameSize) {
    // 单行flex
    return childNodeList.map(it => it.uniqueId)
  }
  if (flexWrap === 'wrap' && childNodeList.length > 2 && isChildSameSize) {
    // 多行flex
    return childNodeList.map(it => it.uniqueId)
  }

  return []
}

export function processDomNodeShouldShrinkBounding(config: { flatNodeMap: Map<UniqueId, NodeInfo>, shouldProcess?: boolean }) {
  const { flatNodeMap, shouldProcess } = config
  if (!shouldProcess) {
    return flatNodeMap
  }
  const newNodeMap = produce(flatNodeMap, (draftFlatNodeMap) => {
    draftFlatNodeMap.forEach((currentNodeInfo) => {
      if (currentNodeInfo.tagName && shouldSkipShrinkBoundingTagNameSet.has(currentNodeInfo.tagName)) {
        currentNodeInfo.shouldSkipShrinkBounding = true
      }
      const { nodeFlexInfo } = currentNodeInfo
      const { isFlex, flexDirection } = nodeFlexInfo || {}
      if (!isFlex)
        return
      if (flexDirection === 'row' || flexDirection === 'row-reverse') {
        const childIdList = processRowFlexNode(currentNodeInfo, draftFlatNodeMap)
        childIdList.forEach((it) => {
          const childNodeInfo = draftFlatNodeMap.get(it)
          if (!childNodeInfo)
            return
          childNodeInfo.shouldSkipShrinkBounding = true
          // childNodeInfo.shouldSkipShrinkBounding = false
        })
      }
    })
  })
  return newNodeMap
}
