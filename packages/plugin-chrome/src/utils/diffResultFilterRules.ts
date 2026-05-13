import type { DiffResultInfo, NodeInfo, UniqueId } from '@ui-differ/core'
import { AlignmentPosition, convertElementAlignmentMarginInfo, getDomNodeByUniqueId, ZZ_UI_TAG } from '@ui-differ/core'
import { produce } from 'immer'

/**
 * 判断差异结果是否有效
 * @param value 差异值
 * @returns
 */
function getValidDistanceResult(value: number) {
  return Math.abs(value) > 1
}

export function diffResultProcessor(originResult: DiffResultInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const newDiffResult = produce(originResult, (diffResult) => {
    const { distanceResult, originNode, designNode } = diffResult

    if (originNode.isZZUI) {
      return
    }

    const isRootNode = !originNode.parentId
    if (isRootNode) {
      return
    }

    const parentNodeInfo = flatNodeMap.get(originNode.parentId)
    if (parentNodeInfo?.children?.length === 1 && !parentNodeInfo.parentId) {
      return
    }

    const elementAlignment: AlignmentPosition = originNode.alignment || AlignmentPosition.LEFT_TOP

    const marginInfoKeyList = convertElementAlignmentMarginInfo[elementAlignment]

    const marginInfoList = marginInfoKeyList.map(({ position, marginKey }) => {
      const originMarginInfo = originNode.neighborMarginInfo[position]
      const designMarginInfo = designNode.neighborMarginInfo[position]
      const isValidateMargin = originMarginInfo?.isDirectlySibling === designMarginInfo?.isDirectlySibling
      if (!isValidateMargin) {
        return 0
      }
      return distanceResult[marginKey]
    })

    const { width, height } = distanceResult

    const isNotSameWidth = getValidDistanceResult(width) && !!originNode.elementSizeConstraintResult?.isWidthConstrained
    const isNotSameHeight = getValidDistanceResult(height) && !!originNode.elementSizeConstraintResult?.isHeightConstrained
    const isMarginInfoNotPass = marginInfoList.some(it => !!getValidDistanceResult(it))

    if (!isNotSameWidth) {
      diffResult.distanceResult.width = 0
    }
    if (!isNotSameHeight) {
      diffResult.distanceResult.height = 0
    }
    if (!isMarginInfoNotPass) {
      marginInfoList.forEach((_, index) => {
        diffResult.distanceResult[marginInfoKeyList[index].marginKey] = 0
      })
    }
  })

  return newDiffResult
}

/**
 * 过滤差异结果
 * @param diffResult 差异结果
 * @returns
 */
export function diffResultFilterRules(diffResult: DiffResultInfo, flatNodeMap: Map<UniqueId, NodeInfo>) {
  const { distanceResult, originNode, designNode } = diffResult

  if (originNode.isZZUI) {
    return false
  }

  const originElement = getDomNodeByUniqueId(originNode.uniqueId)
  // 过滤文本节点
  const isDataTextWrapper = originElement?.getAttribute('data-text-wrapper')
  const zzUITag = originElement?.getAttribute('zz-ui-tag')

  const { textStyleInfo, isChildOfOutOfDocumentFlow, isOutOfDocumentFlow, isBackgroundColorNode } = originNode

  // 图片和图标临时过滤TODO: 真不会有人图片宽高都写不明白吧？
  if (isBackgroundColorNode || zzUITag === ZZ_UI_TAG.ICON) {
    return false
  }

  if (isChildOfOutOfDocumentFlow || isOutOfDocumentFlow) {
    // TODO: 先过滤掉脱离文档流节点的比对结果
    return false
  }
  const { textAlignment } = textStyleInfo || {}

  if (isDataTextWrapper) {
    if (textAlignment === 'left') {
      const { marginLeft } = distanceResult
      return !!getValidDistanceResult(marginLeft)
    }
    return false
  }

  const isRootNode = !originNode.parentId
  if (isRootNode) {
    return false
  }

  const parentNodeInfo = flatNodeMap.get(originNode.parentId)
  if (parentNodeInfo?.children?.length === 1 && !parentNodeInfo.parentId) {
    return false
  }

  const elementAlignment: AlignmentPosition = originNode.alignment || AlignmentPosition.LEFT_TOP

  const marginInfoKeyList = convertElementAlignmentMarginInfo[elementAlignment]

  const marginInfoList = marginInfoKeyList.map(({ position, marginKey }) => {
    const originMarginInfo = originNode.neighborMarginInfo[position]
    const designMarginInfo = designNode.neighborMarginInfo[position]
    const isValidateMargin = originMarginInfo?.isDirectlySibling === designMarginInfo?.isDirectlySibling
    if (!isValidateMargin) {
      return 0
    }
    return distanceResult[marginKey]
  })

  const { width, height } = distanceResult

  const isNotSameWidth = getValidDistanceResult(width) && !!originNode.elementSizeConstraintResult?.isWidthConstrained
  const isNotSameHeight = getValidDistanceResult(height) && !!originNode.elementSizeConstraintResult?.isHeightConstrained
  const isMarginInfoNotPass = marginInfoList.some(it => !!getValidDistanceResult(it))

  return isNotSameWidth
    || isNotSameHeight
    || isMarginInfoNotPass
}
