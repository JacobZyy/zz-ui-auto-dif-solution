import type { NodeInfo, SiblingPosition, UniqueId } from '../types'
import { produce } from 'immer'
import { diffMarginDirectionList } from '../types'

interface SingleDirectionOptions {
  currentNodeInfo: NodeInfo
  direction: SiblingPosition
  flatNodeMap: Map<UniqueId, NodeInfo>
}

/**
 * 找到当前节点在对应方向上第一个匹配到对应设计稿节点的兄弟节点
 */
function findFirstNodeWithMatchResultOnSingleNode(options: SingleDirectionOptions) {
  const { currentNodeInfo, flatNodeMap, direction } = options
  const targetDirectionSiblingId = currentNodeInfo[direction]
  if (!targetDirectionSiblingId) {
    return
  }
  const targetSiblingNodeInfo = flatNodeMap.get(targetDirectionSiblingId)
  if (!targetSiblingNodeInfo) {
    return
  }
  if (targetSiblingNodeInfo?.matchedDesignNodeId) {
    return targetDirectionSiblingId
  }
  return findFirstNodeWithMatchResultOnSingleNode({
    currentNodeInfo: targetSiblingNodeInfo,
    direction,
    flatNodeMap,
  })
}

function correctSingleDirectionMargin(options: SingleDirectionOptions) {
  // 找到第一个有匹配设计节点的兄弟节点
  const targetDirectionSiblingWithMatchedId = findFirstNodeWithMatchResultOnSingleNode(options)
  const { currentNodeInfo, direction } = options
  const originDirectionSiblingId = currentNodeInfo[direction]
  if (!originDirectionSiblingId || !targetDirectionSiblingWithMatchedId || targetDirectionSiblingWithMatchedId === originDirectionSiblingId) {
    // 都没有，或者和当前的是同一个，不需要修改
    return
  }

  // 不是同一个，对应位置的兄弟节点修改为该节点
  return targetDirectionSiblingWithMatchedId
}

export function correctNeighborsByMatchResult(flatNodeMap: Map<UniqueId, NodeInfo>) {
  const newResultMap = produce(flatNodeMap, (draftNodeMap) => {
    draftNodeMap.forEach((currentNodeInfo) => {
      diffMarginDirectionList.forEach((direction) => {
        const fixedId = correctSingleDirectionMargin({ currentNodeInfo, direction, flatNodeMap })
        if (!fixedId) {
          return
        }
        currentNodeInfo[direction] = fixedId
      })
    })
  })

  return newResultMap
}
