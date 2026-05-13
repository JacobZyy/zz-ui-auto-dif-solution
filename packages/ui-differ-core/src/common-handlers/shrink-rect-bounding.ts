import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { convertDirectionKeyToBoudingKeys } from '../types'

type PaddingInfoDirection = 'left' | 'right' | 'top' | 'bottom'
const paddingInfoDirectionList = ['left', 'right', 'top', 'bottom'] as const

/**
 * 获取当前节点下，目标方向的最小距离
 * @param currentNode 当前节点
 * @param currentPosition 目标方向
 * @param flatNodeMap 扁平化节点map
 * @returns
 */
function getMinChildrenPositionDistance(currentNode: NodeInfo, currentPosition: PaddingInfoDirection, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const boundingKeyList = convertDirectionKeyToBoudingKeys[currentPosition]
  const currentNodeTargetPosValue = boundingKeyList.reduce((acc, cur) => acc + currentNode.boundingRect[cur], 0)
  // 左上取小，右下取大
  const targetPositionGetter = currentPosition === 'left' || currentPosition === 'top' ? 'min' : 'max'
  const targetPositionChildren = currentNode.children
    .map((childId) => {
      return flatNodeMap.get(childId)!
    })
    // NOTE: 这边过滤了isOutOfViewport的节点收缩
    .filter(child => child !== undefined && !child.isEmptyNode && !child.isOutOfViewport)
    .map((childNode) => {
      const childTargetValue = boundingKeyList.reduce((acc, cur) => acc + childNode.boundingRect[cur], 0)
      return childTargetValue
    })

  const targetChildValue = targetPositionChildren?.length ? Math[targetPositionGetter](...targetPositionChildren) : 0

  if (targetPositionGetter === 'min') {
    if (targetChildValue < currentNodeTargetPosValue) {
      return 0
    }
    return targetChildValue - currentNodeTargetPosValue
  }
  if (targetPositionGetter === 'max') {
    if (targetChildValue > currentNodeTargetPosValue) {
      return 0
    }
    return currentNodeTargetPosValue - targetChildValue
  }

  return 0
}

export const shrinkRectBounding = produce((flatNodeMap: Map<UniqueId, NodeInfo>) => {
  const entries = Array.from(flatNodeMap.entries()).toReversed()
  if (!entries.length)
    return
  const [rootNodeId] = entries[entries.length - 1]

  // 反向遍历
  entries.forEach(([nodeId]) => {
    const currentNodeInfo = flatNodeMap.get(nodeId)!
    const { children, shouldSkipShrinkBounding } = currentNodeInfo || {}
    if (!children.length || shouldSkipShrinkBounding)
      return

    if (currentNodeInfo.parentId === rootNodeId) {
      const { boundingRect } = currentNodeInfo
      const { y, height } = boundingRect
      const fixedY = y < 0 ? 0 : y
      const fixedHeight = y < 0 ? height - y : height
      if (fixedY === 0 && (fixedHeight >= 176 || fixedHeight <= 184)) {
        // header节点不收缩
        return
      }
    }

    // 找当前节点下的子节点里的最小边距
    paddingInfoDirectionList.forEach((currentPosition) => {
      // 子节点中，目标方向的最小距离
      const targetPositionDistance = getMinChildrenPositionDistance(currentNodeInfo, currentPosition, flatNodeMap)
      // 把当前节点这个方向的位置减少对应的值
      if (currentPosition === 'left') {
        currentNodeInfo.boundingRect.x += targetPositionDistance
        currentNodeInfo.boundingRect.width -= targetPositionDistance
      }
      if (currentPosition === 'right') {
        currentNodeInfo.boundingRect.width -= targetPositionDistance
      }
      if (currentPosition === 'top') {
        currentNodeInfo.boundingRect.y += targetPositionDistance
        currentNodeInfo.boundingRect.height -= targetPositionDistance
      }
      if (currentPosition === 'bottom') {
        currentNodeInfo.boundingRect.height -= targetPositionDistance
      }
    })
  })
},
)
