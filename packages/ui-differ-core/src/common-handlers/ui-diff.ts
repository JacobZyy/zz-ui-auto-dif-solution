import type { DiffResultInfo, NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { convertPositionToBoundingKeys, diffMarginDirectionList, NodeFlexType, SiblingPosition, siblingPositionToDiffResultKey } from '../types'
import { fixedSubstract, getMultiLineHeightOffset } from '../utils'

interface DiffResultOptions {
  currentNodeInfo: NodeInfo
  designNode: NodeInfo
}

/**
 * 判断当前节点是否为flex1
 * @param nodeInfo 当前节点
 * @param flatNodeMap 所有节点map
 * @returns {NodeFlexType} flex类型
 */
function getIsFlex1(nodeInfo: NodeInfo, flatNodeMap: Map<UniqueId, NodeInfo>): NodeFlexType {
  const parentNode = flatNodeMap.get(nodeInfo.parentId)
  if (!parentNode)
    return NodeFlexType.NOT_FLEX
  if (!parentNode.nodeFlexInfo?.isFlex)
    return NodeFlexType.NOT_FLEX
  if (nodeInfo.nodeFlexInfo?.flexGrow !== '1') {
    return NodeFlexType.NOT_FLEX_1
  }
  if (parentNode.nodeFlexInfo?.flexDirection === 'column' || parentNode.nodeFlexInfo?.flexDirection === 'column-reverse') {
    return NodeFlexType.FLEX_COLUMN_1
  }
  return NodeFlexType.FLEX_ROW_1
}

/**
 * 计算权重差值
 * @param diffResult
 * @returns
 */
function calculateWeightedDifference(diffResult: DiffResultInfo): number {
  const { distanceResult } = diffResult
  const marginWeight = 0.2
  const sizeWeight = 0.1
  const marginKeyList = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const
  const marginTotal = marginKeyList.reduce((acc, key) => acc + Math.abs(distanceResult[key]), 0)
  const sizeTotal = Math.abs(distanceResult.width) + Math.abs(distanceResult.height)

  return marginTotal * marginWeight + sizeTotal * sizeWeight
}

function createDiffResult({ currentNodeInfo, designNode }: DiffResultOptions): DiffResultInfo {
  const { boundingRect, neighborMarginInfo } = currentNodeInfo
  const { boundingRect: designNodeBoundingRect, neighborMarginInfo: designNodeNeighborMarginInfo } = designNode

  const widthDiff = fixedSubstract(boundingRect.width, designNodeBoundingRect.width)
  const heightDiff = fixedSubstract(boundingRect.height, designNodeBoundingRect.height)
  const marginValueEntries = diffMarginDirectionList.map((direction) => {
    const originValue = neighborMarginInfo?.[direction]?.value || 0
    const designValue = designNodeNeighborMarginInfo?.[direction]?.value || 0
    return [siblingPositionToDiffResultKey[direction], fixedSubstract(originValue, designValue)] as const
  })

  const marginValueMap = new Map(marginValueEntries)

  return {
    distanceResult: {
      width: widthDiff,
      height: heightDiff,
      marginLeft: marginValueMap.get('marginLeft') || 0,
      marginRight: marginValueMap.get('marginRight') || 0,
      marginTop: marginValueMap.get('marginTop') || 0,
      marginBottom: marginValueMap.get('marginBottom') || 0,
    },
    originNode: currentNodeInfo,
    designNode,
  }
}

/**
 * 修正diff结果
 */
function correctDiffResult({ diffResultMap, flatNodeMap, designNodeMap }: { diffResultMap: Map<UniqueId, DiffResultInfo>, flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo> }) {
  return produce(diffResultMap, (draftDiffResultMap) => {
    draftDiffResultMap.forEach((diffResult) => {
      const { originNode, designNode } = diffResult
      // 修正flex1场景下的宽高比对结果
      const currentFlexType = getIsFlex1(originNode, flatNodeMap)
      const isRowFlex1 = currentFlexType === NodeFlexType.FLEX_ROW_1
      const isColumnFlex1 = currentFlexType === NodeFlexType.FLEX_COLUMN_1
      if (isRowFlex1) {
        diffResult.distanceResult.width = 0
      }
      if (isColumnFlex1) {
        diffResult.distanceResult.height = 0
      }

      const topSiblingNodeInfo = flatNodeMap.get(originNode[SiblingPosition.TOP] || '')
      const topMatchedDesignNode = designNodeMap.get(topSiblingNodeInfo?.matchedDesignNodeId || '')

      const { top: siblingTopOffset, height: siblingHeightOffset, coefficient: siblingCoefficient = 1 } = (topSiblingNodeInfo && topMatchedDesignNode) ? getMultiLineHeightOffset(topSiblingNodeInfo, topMatchedDesignNode, flatNodeMap) : { top: 0, height: 0 }
      const { top: textStyleTopOffset, height: textStyleHeightOffset, coefficient: textStyleCoefficient = 1 } = getMultiLineHeightOffset(originNode, designNode, flatNodeMap)
      const siblingBottomOffsetValue = siblingHeightOffset - siblingTopOffset
      // 上方边距纠正：上方节点的bottom+当前节点的top
      diffResult.distanceResult.marginTop += siblingBottomOffsetValue * siblingCoefficient + textStyleTopOffset * textStyleCoefficient
      // height纠正
      diffResult.distanceResult.height += textStyleHeightOffset * textStyleCoefficient
      // 下方边距纠正 TODO: 这个不重要
    })
  })
}

/**
 * 获取单方向嵌套重复的修正值
 */
function getSingleDirectionNestedRepeatFixedValue(options: { parentNodeInfo: NodeInfo, currentNodeInfo: NodeInfo, parentDiffResult: DiffResultInfo, currentDiffResultInfo: DiffResultInfo, direction: SiblingPosition }) {
  const { parentNodeInfo, currentNodeInfo, parentDiffResult, currentDiffResultInfo, direction } = options
  const parentDiffValue = parentDiffResult.distanceResult[siblingPositionToDiffResultKey[direction]]
  const currentDiffValue = currentDiffResultInfo.distanceResult[siblingPositionToDiffResultKey[direction]]

  if (!parentDiffValue) {
    return currentDiffValue
  }
  const boundingKeys = convertPositionToBoundingKeys[direction]
  const currentDistance = boundingKeys.reduce((acc, key) => acc + currentNodeInfo.boundingRect[key], 0)
  const parentDistance = boundingKeys.reduce((acc, key) => acc + parentNodeInfo.boundingRect[key], 0)

  // 是否在这个位置重叠
  const isOverlap = currentDistance === parentDistance
  // 不重叠，说明不需要修正，返回0
  if (!isOverlap) {
    return currentDiffValue
  }
  // 重叠，则返回父节点的修正值
  return parentDiffValue - currentDiffValue
}

/**
 * 获取当前节点的父节点中第一个有diff结果的节点
 * @param options
 * @returns
 */
function getFirstParentNodeWithDiffResult(options: { currentNodeId: string, flatNodeMap: Map<UniqueId, NodeInfo>, diffResultMap: Map<UniqueId, DiffResultInfo> }) {
  const { currentNodeId, flatNodeMap, diffResultMap } = options
  const parentNodeId = flatNodeMap.get(currentNodeId)?.parentId
  if (!parentNodeId) {
    return
  }
  const parentDiffResult = diffResultMap.get(parentNodeId)
  if (parentDiffResult) {
    return parentNodeId
  }

  return getFirstParentNodeWithDiffResult({ currentNodeId: parentNodeId, flatNodeMap, diffResultMap })
}

function fixNestedRepeat({ diffResultMap, flatNodeMap }: { diffResultMap: Map<UniqueId, DiffResultInfo>, flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo> }) {
  return produce(diffResultMap, (draftDiffResultMap) => {
    // 倒层序修正，优先子节点，再修父节点
    const reversedEntries = Array.from(draftDiffResultMap.values()).toReversed()
    reversedEntries.forEach((diffResult) => {
      const { originNode } = diffResult
      // 修正嵌套节点的重复问题
      const firstParentWithDiffResult = getFirstParentNodeWithDiffResult({ currentNodeId: originNode.uniqueId, flatNodeMap, diffResultMap: draftDiffResultMap })

      const targetParentNodeInfo = flatNodeMap.get(firstParentWithDiffResult || '')
      const targetParentDiffResult = draftDiffResultMap.get(firstParentWithDiffResult || '')
      if (!targetParentNodeInfo || !targetParentDiffResult) {
        return
      }
      diffMarginDirectionList.forEach((direction) => {
        const targetDistanceKey = siblingPositionToDiffResultKey[direction]
        diffResult.distanceResult[targetDistanceKey] = getSingleDirectionNestedRepeatFixedValue({
          parentNodeInfo: targetParentNodeInfo,
          currentNodeInfo: originNode,
          parentDiffResult: targetParentDiffResult,
          currentDiffResultInfo: diffResult,
          direction,
        })
      })
    })
  })
}

export function uiDiff(flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>): DiffResultInfo[] {
  const allDiffResultMap = new Map<UniqueId, DiffResultInfo>()
  const filteredDiffResultMap = new Map<UniqueId, DiffResultInfo>()
  // 第一次遍历：收集所有DOM节点的diff结果
  flatNodeMap.forEach((currentNodeInfo) => {
    const { matchedDesignNodeId } = currentNodeInfo
    const designNode = designNodeMap.get(matchedDesignNodeId || '')
    if (!designNode) {
      return
    }

    const diffResult = createDiffResult({ currentNodeInfo, designNode })
    allDiffResultMap.set(currentNodeInfo.uniqueId, diffResult)
  })

  // 第二遍：修正嵌套节点的重复问题
  const fixedDiffResultMap = fixNestedRepeat({ diffResultMap: allDiffResultMap, flatNodeMap, designNodeMap })

  // 第三遍遍历：遍历一遍修正一些间距
  const correctedDiffResultMap = correctDiffResult({ diffResultMap: fixedDiffResultMap, flatNodeMap, designNodeMap })

  // 第二次遍历：按design节点分组并筛选最佳匹配
  const candidatesByDesignNode = new Map<UniqueId, DiffResultInfo[]>()

  correctedDiffResultMap.forEach((diffResult) => {
    const designNodeId = diffResult.designNode.uniqueId

    if (!candidatesByDesignNode.has(designNodeId)) {
      candidatesByDesignNode.set(designNodeId, [])
    }
    candidatesByDesignNode.get(designNodeId)!.push(diffResult)
  })

  candidatesByDesignNode.forEach((candidates, _designNodeId) => {
    if (candidates.length <= 1) {
      const result = candidates[0]
      filteredDiffResultMap.set(result.originNode.uniqueId, result)
    }

    // if (__DEV__) {
    //   console.log(`设计节点 ${designNodeMap.get(designNodeId)!.nodeName} 匹配到 ${candidates.length} 个DOM节点，正在选择最佳匹配`)
    // }
    const bestMatch = candidates.reduce((best, current) => {
      const bestScore = calculateWeightedDifference(best)
      const currentScore = calculateWeightedDifference(current)
      return currentScore < bestScore ? current : best
    })

    // if (__DEV__) {
    //   const bestScore = calculateWeightedDifference(bestMatch)
    //   console.log(`选择DOM节点 `, getDomNodeByUniqueId(bestMatch.originNode.uniqueId), `，加权差距: ${bestScore.toFixed(3)}`)
    //   const filteredCount = candidates.length - 1
    //   console.log(`过滤掉 ${filteredCount} 个差距较大的DOM节点`)
    // }

    filteredDiffResultMap.set(bestMatch.originNode.uniqueId, bestMatch)
  })

  return Array.from(filteredDiffResultMap.values())
}
