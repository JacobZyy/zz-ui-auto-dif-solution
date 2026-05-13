import type { BoundingRect, MatchResult, NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'
import { AlignmentPosition } from '../types'
import { alignmentKeyNodeCalculatorMap } from '../utils/alignment-key-node-calculator'

interface MatchedPair {
  domNodeId: UniqueId
  designNodeId: UniqueId
  offset: { x: number, y: number }
}

/**
 * 计算两个矩形的重叠面积比例 (IoU)
 */
function calculateOverlapRatio(domRect: BoundingRect, designRect: BoundingRect): number {
  const correctedDesignRect = {
    x: designRect.x,
    y: designRect.y,
    width: designRect.width,
    height: designRect.height,
  }

  const overlapX = Math.max(0, Math.min(domRect.x + domRect.width, correctedDesignRect.x + correctedDesignRect.width) - Math.max(domRect.x, correctedDesignRect.x))
  const overlapY = Math.max(0, Math.min(domRect.y + domRect.height, correctedDesignRect.y + correctedDesignRect.height) - Math.max(domRect.y, correctedDesignRect.y))
  const overlapArea = overlapX * overlapY

  const domArea = domRect.width * domRect.height
  const designArea = correctedDesignRect.width * correctedDesignRect.height
  const unionArea = domArea + designArea - overlapArea

  return unionArea > 0 ? overlapArea / unionArea : 0
}

/**
 * 计算中心点距离
 */
function calculateCenterDistance(domRect: BoundingRect, designRect: BoundingRect, domNodeAlignment: AlignmentPosition): number {
  const domNodeKeyPoint = alignmentKeyNodeCalculatorMap[domNodeAlignment](domRect)
  const designNodeKeyPoint = alignmentKeyNodeCalculatorMap[domNodeAlignment](designRect)
  const deltaX = Math.abs(domNodeKeyPoint.x - designNodeKeyPoint.x)
  const deltaY = Math.abs(domNodeKeyPoint.y - designNodeKeyPoint.y)
  const squareDeltaX = deltaX * deltaX
  const squareDeltaY = deltaY * deltaY
  const squareDistance = squareDeltaX + squareDeltaY
  const result = Math.sqrt(squareDistance)
  return result
}

interface MatchSingleNodeOptions {
  domNode: NodeInfo
  designNodeMap: Map<UniqueId, NodeInfo>
}

function getMatchRate(domNode: NodeInfo, designNode: NodeInfo) {
  const domNodeAlignment = domNode.alignment || AlignmentPosition.LEFT_TOP
  // 计算中心点距离和重叠面积比例
  const centerDistance = calculateCenterDistance(domNode.boundingRect, designNode.boundingRect, domNodeAlignment)
  const overlapRatio = calculateOverlapRatio(domNode.boundingRect, designNode.boundingRect)
  // 综合评分：重叠面积权重更高，中心点距离作为辅助
  // 距离越小越好，重叠比例越大越好
  const normalizedCenterScore = Math.max(0, 1 - centerDistance / 50) // 假设50px为最大可接受距离
  const finalScore = normalizedCenterScore * 0.4 + overlapRatio * 0.6
  return {
    centerDistance,
    overlapRatio,
    finalScore,
  }
}

/**
 * 单个DOM节点的混合匹配
 */
function matchSingleNode({ domNode, designNodeMap }: MatchSingleNodeOptions): MatchResult | undefined {
  let bestMatch: MatchResult | undefined
  let bestScore = -1
  // const domEl = getDomNodeByUniqueId(domNode.uniqueId)
  // console.log('🚀 ~ =========节点开始寻找匹配的设计稿节点---------当前节点：\n', domEl)

  designNodeMap.forEach((designNode) => {
    const scoreInfo = getMatchRate(domNode, designNode)
    // console.log(`🚀 ~>>>>>>>>>>>与设计稿节点${designNode.nodeName}匹配, 匹配结果为：\n`, scoreInfo)
    if (scoreInfo.finalScore <= bestScore || scoreInfo.finalScore < 0.5) {
      return
    }
    bestScore = scoreInfo.finalScore
    bestMatch = {
      designNodeId: designNode.uniqueId,
      confidence: scoreInfo.finalScore,
      centerDistance: scoreInfo.centerDistance,
      overlapRatio: scoreInfo.overlapRatio,
    }
  })

  return bestMatch
}

/**
 * 混合节点匹配器主函数
 */
export function recordHybridNodeMatchResult(flatNodeMap: Map<UniqueId, NodeInfo>, designNodeMap: Map<UniqueId, NodeInfo>) {
  return produce(flatNodeMap, (draftFlatNodeMap) => {
    const matchedPairs: MatchedPair[] = []
    Array.from(draftFlatNodeMap.values()).forEach((domNode) => {
    // 单节点匹配
      const matchResult = matchSingleNode({ domNode, designNodeMap })
      if (!matchResult)
        return
      // 记录匹配结果
      domNode.matchedDesignNodeId = matchResult.designNodeId
      domNode.matchResult = matchResult

      // 计算并记录偏移量（考虑宽高差异）·
      const designNode = designNodeMap.get(matchResult.designNodeId)!

      // 基于中心点计算偏移量，考虑宽高差异
      const domCenterX = domNode.boundingRect.x + domNode.boundingRect.width / 2
      const domCenterY = domNode.boundingRect.y + domNode.boundingRect.height / 2
      const designCenterX = designNode.boundingRect.x + designNode.boundingRect.width / 2
      const designCenterY = designNode.boundingRect.y + designNode.boundingRect.height / 2

      const offsetX = domCenterX - designCenterX
      const offsetY = domCenterY - designCenterY

      const matchPairInfo: MatchedPair = {
        domNodeId: domNode.uniqueId,
        designNodeId: matchResult.designNodeId,
        offset: { x: offsetX, y: offsetY },
      }

      matchedPairs.push(matchPairInfo)
    })
  })
}
