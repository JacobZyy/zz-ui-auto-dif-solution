import type { Draft } from 'immer'
import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { AlignmentPosition, SiblingPosition } from '../types'
import { isSameDistance } from '../utils'

/**
 * 替换目标位置的节点
 * @param sourceId 需要被替换的节点
 * @param targetId 取代的节点
 * @param originIdList 原始的节点列表
 * @returns 新的节点列表
 */
function replaceTargetPositionNode(sourceId: UniqueId, targetId: UniqueId, originIdList: UniqueId[]) {
  return originIdList.map((id) => {
    if (id === sourceId) {
      return targetId
    }
    if (id === targetId) {
      return null
    }
    return id
  }).filter(it => it != null)
}

function getIsSameDistance(currentNodeInfo: NodeInfo, parentNodeInfo: NodeInfo, distanceKey: 'height' | 'width', prevRemove: boolean) {
  const { boundingRect: { [distanceKey]: currentNodeDistance } } = currentNodeInfo
  const { boundingRect: { [distanceKey]: parentNodeDistance } } = parentNodeInfo
  if (!prevRemove) {
    return isSameDistance(currentNodeDistance, parentNodeDistance)
  }
  const paddingKey = distanceKey === 'width' ? ['paddingTop', 'paddingBottom'] as const : ['paddingLeft', 'paddingRight'] as const
  const paddingDistance = paddingKey.reduce((total, curKey) => total + parentNodeInfo.paddingInfo[curKey], 0)
  return isSameDistance(currentNodeDistance + paddingDistance, parentNodeDistance + paddingDistance)
}

function combineAlignmentInfo(currentNodeInfo: Draft<NodeInfo>, flatNodeMap: Map<UniqueId, NodeInfo>, prevRemove: boolean) {
  const parentNode = flatNodeMap.get(currentNodeInfo.parentId)
  if (!parentNode)
    return
  const isSameWidthWithParent = getIsSameDistance(currentNodeInfo, parentNode, 'width', prevRemove)
  if (!isSameWidthWithParent) {
    return
  }
  const firstChildNode = flatNodeMap.get(currentNodeInfo.children[0])
  if (!firstChildNode)
    return

  const isSameWidthWithFirstChild = getIsSameDistance(firstChildNode, currentNodeInfo, 'width', prevRemove)
  if (isSameWidthWithFirstChild) {
    return
  }

  // 和父节点相同，和字节点宽度不相同时，将当前节点的alignment同步成子节点的alignment
  currentNodeInfo.alignment = firstChildNode.alignment
}

/**
 * 合并父节点信息到子节点中
 * @param parentNodeInfo 父节点信息
 * @param childNodeInfo 子节点信息
 * @returns 合并后的节点信息
 */
function mergeParentNodeIntoChildNode(parentNodeInfo: NodeInfo, childNodeInfo: NodeInfo) {
  // 合并父子节点信息
  // NODE!: 这里合并会丢一些后续用不到的信息
  const mergedNodeInfo: NodeInfo = {
    nodeName: childNodeInfo.nodeName,
    uniqueId: childNodeInfo.uniqueId,
    children: childNodeInfo.children,
    boundingRect: childNodeInfo.boundingRect,
    parentId: parentNodeInfo.parentId,
    paddingInfo: childNodeInfo.paddingInfo,
    borderInfo: childNodeInfo.borderInfo,
    backgroundColor: childNodeInfo.backgroundColor,
    originBounding: childNodeInfo.originBounding,
    isBFC: childNodeInfo.isBFC,
    isOutOfDocumentFlow: childNodeInfo.isOutOfDocumentFlow,
    isChildOfOutOfDocumentFlow: childNodeInfo.isChildOfOutOfDocumentFlow,
    textStyleInfo: childNodeInfo.textStyleInfo,
    isEmptyNode: false, // 有合并，说明既不是背景节点也不是纯色节点
    isBackgroundColorNode: false,
    shouldSkipShrinkBounding: childNodeInfo.shouldSkipShrinkBounding,
    nodeFlexInfo: parentNodeInfo.nodeFlexInfo,
    isInlineNode: childNodeInfo.isInlineNode,
    isTextWrapper: childNodeInfo.isTextWrapper,
    tagName: childNodeInfo.tagName,
    isOutOfViewport: childNodeInfo.isOutOfViewport,
    // 判断的逻辑是父节点只有一个子节点
    // 所以可以直接把父节点的兄弟节点作为该子节点的兄弟节点
    sibling: parentNodeInfo.sibling,
    initialNeighborInfos: parentNodeInfo.initialNeighborInfos,
    neighborMarginInfo: parentNodeInfo.neighborMarginInfo,
    listElementTag: parentNodeInfo.listElementTag,
    isZZUI: !!parentNodeInfo.isZZUI || !!childNodeInfo.isZZUI,
    alignment: parentNodeInfo.alignment || AlignmentPosition.LEFT_TOP,
    // 相邻节点同步为父节点的相邻节点
    [SiblingPosition.TOP]: parentNodeInfo[SiblingPosition.TOP],
    [SiblingPosition.BOTTOM]: parentNodeInfo[SiblingPosition.BOTTOM],
    [SiblingPosition.LEFT]: parentNodeInfo[SiblingPosition.LEFT],
    [SiblingPosition.RIGHT]: parentNodeInfo[SiblingPosition.RIGHT],
  }
  return mergedNodeInfo
}

export async function removeSameSizePositionChildren(options: { flatNodeMap: Map<UniqueId, NodeInfo>, prevRemove: boolean }) {
  const { flatNodeMap, prevRemove } = options
  // 原层序的顺序
  const floorNodeIdList = Array.from(flatNodeMap.keys())

  // 需要取代的节点的键值对 key: 需要被取代的节点，value: 取代的节点
  const nodeIdReplaceEntries = Array.from(floorNodeIdList).map((currentNodeId: UniqueId) => {
    const curNode = flatNodeMap.get(currentNodeId)
    const childrenList = curNode?.children || []
    if (!curNode || childrenList.length !== 1)
      return null

    const childNodeId = childrenList[0]
    const childNode = flatNodeMap.get(childNodeId)
    if (!childNode)
      return null
    const { width, height, x, y } = childNode.boundingRect
    const isSameSize = isSameDistance(curNode.boundingRect.width, width) && isSameDistance(curNode.boundingRect.height, height)
    const isSamePosition = isSameDistance(curNode.boundingRect.x, x) && isSameDistance(curNode.boundingRect.y, y)
    if (!isSameSize || !isSamePosition)
      return null
    // 如果当前节点和子节点尺寸和位置相同，则返回当前节点id(需要被排除)
    return [currentNodeId, childNodeId] as const
  }).filter(it => it != null)
  if (nodeIdReplaceEntries.length === 0) {
    return flatNodeMap
  }

  // 更新alignment字段
  const updatedAlignmentInfoMap = produce(flatNodeMap, (draftFlatNodeMap) => {
    draftFlatNodeMap.forEach((currentNodeInfo) => {
      // NOTE: 这里要用flatNodeMap保留原信息
      combineAlignmentInfo(currentNodeInfo, flatNodeMap, prevRemove)
    })
  })

  // 更新层序的顺序
  const newFloorNodeIdList = produce(floorNodeIdList, (draft) => {
    nodeIdReplaceEntries.forEach(([parentNodeId, replaceChildNodeId]) => {
      draft = replaceTargetPositionNode(parentNodeId, replaceChildNodeId, draft)
    })
  })

  /** key: 需要被取代的节点，value: 取代的节点 */
  const nodeIdReplaceMap = new Map(nodeIdReplaceEntries)

  const updatedFlatMap = produce(updatedAlignmentInfoMap, (draftNodeMap) => {
    draftNodeMap.forEach((nodeInfo, nodeId) => {
      const replaceChildNodeId = nodeIdReplaceMap.get(nodeId)
      const replaceChildNodeInfo = draftNodeMap.get(replaceChildNodeId || '')
      if (!replaceChildNodeInfo || !replaceChildNodeId)
        return
      // 如果当前是替换的节点，则需要更新当前节点中的替换关系
      const replacedNodeInfo = mergeParentNodeIntoChildNode(nodeInfo, replaceChildNodeInfo)

      draftNodeMap.delete(nodeId)

      draftNodeMap.set(replaceChildNodeId, replacedNodeInfo)
    })
  })

  const updateReplacementIdMap = produce(updatedFlatMap, (draftNodeMap) => {
    draftNodeMap.forEach((currentNodeInfo) => {
      nodeIdReplaceMap.forEach((replaceChildNodeId, parentNodeId) => {
        const {
          sibling,
          children,
          [SiblingPosition.TOP]: topNodeId,
          [SiblingPosition.BOTTOM]: bottomNodeId,
          [SiblingPosition.LEFT]: leftNodeId,
          [SiblingPosition.RIGHT]: rightNodeId,
        } = currentNodeInfo
        const newSibling = replaceTargetPositionNode(parentNodeId, replaceChildNodeId, sibling)
        const newChildren = replaceTargetPositionNode(parentNodeId, replaceChildNodeId, children)
        const newTopNodeId = topNodeId === parentNodeId ? replaceChildNodeId : topNodeId
        const newBottomNodeId = bottomNodeId === parentNodeId ? replaceChildNodeId : bottomNodeId
        const newLeftNodeId = leftNodeId === parentNodeId ? replaceChildNodeId : leftNodeId
        const newRightNodeId = rightNodeId === parentNodeId ? replaceChildNodeId : rightNodeId
        currentNodeInfo.sibling = newSibling
        currentNodeInfo.children = newChildren
        currentNodeInfo[SiblingPosition.TOP] = newTopNodeId
        currentNodeInfo[SiblingPosition.BOTTOM] = newBottomNodeId
        currentNodeInfo[SiblingPosition.LEFT] = newLeftNodeId
        currentNodeInfo[SiblingPosition.RIGHT] = newRightNodeId
      })
    })
  })

  // 调整层序的顺序
  const resultMapEntries = newFloorNodeIdList
    .map((nodeId) => {
      const nodeInfo = updateReplacementIdMap.get(nodeId)
      if (!nodeInfo)
        return null
      return [nodeId, nodeInfo] as const
    })
    .filter(it => it != null)

  const newFlatMap = new Map<UniqueId, NodeInfo>(resultMapEntries)
  return removeSameSizePositionChildren({ flatNodeMap: newFlatMap, prevRemove })
}
