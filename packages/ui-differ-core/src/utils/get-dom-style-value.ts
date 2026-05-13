import type { BorderInfo, BorderKey, DomMarginInfo, NodeInfo, PaddingInfo, TextAlignment } from '../types'
import { convertRealPxValue } from './convert-real-px-value'
import { processTransparentColor } from './process-color-value'

function getDomScaleTransformValue(computedStyle: CSSStyleDeclaration) {
  // 获取transform矩阵
  const transformMatrix = computedStyle.getPropertyValue('transform')
  // 获取transform矩阵数组
  const transformMatrixArray = transformMatrix.split('(')?.[1]?.split(')')?.[0]?.split(',')?.map(Number) || []
  // 判断是否为3d变换
  const is3dTransform = transformMatrixArray.length > 6
  // 获取x轴缩放比例
  const scaleX = (is3dTransform ? transformMatrixArray[0] : transformMatrixArray[0]) || 1
  // 获取y轴缩放比例
  const scaleY = is3dTransform ? transformMatrixArray[3] : transformMatrixArray[1] || 1
  return {
    scaleX,
    scaleY,
  }
}

/**
 * 获取dom的内边距的值
 * @param dom 目标dom
 * @param styleName 样式名
 * @returns 样式值
 */
export function getDomPaddingInfo(dom: Element): PaddingInfo {
  // 获取dom的计算样式
  const computedStyle = window.getComputedStyle(dom)

  // 获取dom的样式值
  const paddingLeft = Number(computedStyle.getPropertyValue('padding-left').replace('px', '')) || 0
  const paddingRight = Number(computedStyle.getPropertyValue('padding-right').replace('px', '')) || 0
  const paddingTop = Number(computedStyle.getPropertyValue('padding-top').replace('px', '')) || 0
  const paddingBottom = Number(computedStyle.getPropertyValue('padding-bottom').replace('px', '')) || 0
  const { scaleX, scaleY } = getDomScaleTransformValue(computedStyle)

  const paddingInfo: PaddingInfo = {
    paddingLeft: paddingLeft / scaleX,
    paddingRight: paddingRight / scaleX,
    paddingTop: paddingTop / scaleY,
    paddingBottom: paddingBottom / scaleY,
  }
  return paddingInfo
}

const gradientPrefixSet = ['linear-gradient', 'radial-gradient', 'conic-gradient']

/**
 * 获取dom的背景色，如果背景色为透明，则返回'transparent'
 * @param dom 目标dom
 * @returns 背景色
 */
export function getDomBackgroundColor(dom: Element): string {
  const computedStyle = window.getComputedStyle(dom)
  const image = computedStyle.getPropertyValue('background-image')
  const isImageGradient = gradientPrefixSet.some(it => image.startsWith(it))
  const isImgTag = dom.tagName === 'IMG'
  if ((image && image !== 'none' && !isImageGradient) || isImgTag) {
    return 'background-image'
  }
  const color = computedStyle.getPropertyValue('background-color')
  return processTransparentColor(color)
}

/**
 * 获取dom的边框信息
 * @param computedStyle 目标dom的计算样式
 * @returns 边框信息
 */
function getDomBorderInfoByComputedStyle(computedStyle: CSSStyleDeclaration, from: 'before' | 'after' | 'normal'): BorderInfo {
  const { scaleX, scaleY } = getDomScaleTransformValue(computedStyle)
  const borderWidthLeft = (Number(computedStyle.getPropertyValue('border-left-width').replace('px', '')) || 0) * scaleX
  const borderWidthRight = (Number(computedStyle.getPropertyValue('border-right-width').replace('px', '')) || 0) * scaleX
  const borderWidthTop = (Number(computedStyle.getPropertyValue('border-top-width').replace('px', '')) || 0) * scaleY
  const borderWidthBottom = (Number(computedStyle.getPropertyValue('border-bottom-width').replace('px', '')) || 0) * scaleY
  const borderColorLeft = processTransparentColor(computedStyle.getPropertyValue('border-left-color'))
  const borderColorRight = processTransparentColor(computedStyle.getPropertyValue('border-right-color'))
  const borderColorTop = processTransparentColor(computedStyle.getPropertyValue('border-top-color'))
  const borderColorBottom = processTransparentColor(computedStyle.getPropertyValue('border-bottom-color'))

  return {
    borderLeft: {
      width: borderWidthLeft > 0 ? Math.max(borderWidthLeft, 1) : 0,
      color: borderColorLeft,
      from,
    },
    borderRight: {
      width: borderWidthRight > 0 ? Math.max(borderWidthRight, 1) : 0,
      color: borderColorRight,
      from,
    },
    borderTop: {
      width: borderWidthTop > 0 ? Math.max(borderWidthTop, 1) : 0,
      color: borderColorTop,
      from,
    },
    borderBottom: {
      width: borderWidthBottom > 0 ? Math.max(borderWidthBottom, 1) : 0,
      color: borderColorBottom,
      from,
    },
  }
}

interface GetBorderFromOptions {
  normalBorderInfo: BorderInfo
  beforeBorderInfo: BorderInfo
  afterBorderInfo: BorderInfo
  targetBorderKey: BorderKey
}

export function getValideBorder(options: GetBorderFromOptions) {
  const { normalBorderInfo, beforeBorderInfo, afterBorderInfo, targetBorderKey } = options
  const borderInfoList = [normalBorderInfo, beforeBorderInfo, afterBorderInfo].map(it => it[targetBorderKey]).filter(it => !!it.width && it.color !== 'transparent')
  if (!borderInfoList.length) {
    return normalBorderInfo[targetBorderKey]
  }
  return borderInfoList[0]
}

/**
 * 获取dom的边框信息
 * @param dom 目标dom
 * @returns 边框信息
 */
export function getDomBorderInfo(dom: Element): BorderInfo {
  const computedStyle = window.getComputedStyle(dom)
  const pseudoBeforeStyle = window.getComputedStyle(dom, '::before')
  const pseudoAfterStyle = window.getComputedStyle(dom, '::after')
  const originDomBorderInfo = getDomBorderInfoByComputedStyle(computedStyle, 'normal')
  const pseudoBeforeBorderInfo = getDomBorderInfoByComputedStyle(pseudoBeforeStyle, 'before')
  const pseudoAfterBorderInfo = getDomBorderInfoByComputedStyle(pseudoAfterStyle, 'after')

  const borderLeft = getValideBorder({
    normalBorderInfo: originDomBorderInfo,
    beforeBorderInfo: pseudoBeforeBorderInfo,
    afterBorderInfo: pseudoAfterBorderInfo,
    targetBorderKey: 'borderLeft',
  })

  const borderRight = getValideBorder({
    normalBorderInfo: originDomBorderInfo,
    beforeBorderInfo: pseudoBeforeBorderInfo,
    afterBorderInfo: pseudoAfterBorderInfo,
    targetBorderKey: 'borderRight',
  })

  const borderTop = getValideBorder({
    normalBorderInfo: originDomBorderInfo,
    beforeBorderInfo: pseudoBeforeBorderInfo,
    afterBorderInfo: pseudoAfterBorderInfo,
    targetBorderKey: 'borderTop',
  })

  const borderBottom = getValideBorder({
    normalBorderInfo: originDomBorderInfo,
    beforeBorderInfo: pseudoBeforeBorderInfo,
    afterBorderInfo: pseudoAfterBorderInfo,
    targetBorderKey: 'borderBottom',
  })

  return { borderLeft, borderRight, borderTop, borderBottom }
}
/**
 * 判断DOM元素是否建立了块级格式化上下文(BFC)
 * @param dom 目标DOM元素
 * @returns 是否为BFC元素
 */
export function getDomIsBfc(dom: Element): boolean {
  const computedStyle = window.getComputedStyle(dom)
  // 根元素(html)
  if (dom === document.documentElement) {
    return true
  }

  // float值不为none
  const float = computedStyle.getPropertyValue('float')
  if (float !== 'none') {
    return true
  }

  // position值为absolute或fixed
  const position = computedStyle.getPropertyValue('position')
  const bfcPositionSet = new Set(['absolute', 'fixed'])
  if (bfcPositionSet.has(position)) {
    return true
  }
  // display值为inline-block、table-cell、table-caption、flex、inline-flex、grid、inline-grid、table、flow-root
  const display = computedStyle.getPropertyValue('display')
  const bfcDisplayValues = new Set([
    'inline-block',
    'table-cell',
    'table-caption',
    'flex',
    'inline-flex',
    'grid',
    'inline-grid',
    'flow-root',
    'table',
  ])
  if (bfcDisplayValues.has(display)) {
    return true
  }
  // overflow值不为visible和clip
  // 注意：只有当overflow-x或overflow-y的计算值不为visible时才创建BFC
  const overflowX = computedStyle.getPropertyValue('overflow-x')
  const overflowY = computedStyle.getPropertyValue('overflow-y')
  const hasNonVisibleOverflow = overflowX !== 'visible' || overflowY !== 'visible'
  const hasClipOverflow = overflowX === 'clip' || overflowY === 'clip'

  if (hasNonVisibleOverflow && !hasClipOverflow) {
    return true
  }
  // contain值为layout、content或paint（精确匹配）
  const contain = computedStyle.getPropertyValue('contain')
  if (contain) {
    const containValues = contain.split(' ')
    const bfcContainValues = new Set(['layout', 'content', 'paint', 'strict'])
    const hasBfcContain = containValues.some(value => bfcContainValues.has(value))
    if (hasBfcContain) {
      return true
    }
  }
  // column-count或column-width不为auto，或column-span为all
  const columnCount = computedStyle.getPropertyValue('column-count')
  const columnWidth = computedStyle.getPropertyValue('column-width')
  const columnSpan = computedStyle.getPropertyValue('column-span')

  if (columnCount !== 'auto' || columnWidth !== 'auto' || columnSpan === 'all') {
    return true
  }

  return false
}

/**
 * 获取dom的内边距的值
 * @param dom 目标dom
 * @param styleName 样式名
 * @returns 样式值
 */
export function getDomMarginInfo(dom: Element): DomMarginInfo {
  // 获取dom的计算样式
  const computedStyle = window.getComputedStyle(dom)
  const marginTop = Number(computedStyle.getPropertyValue('margin-top').replace('px', '')) || 0
  const marginBottom = Number(computedStyle.getPropertyValue('margin-bottom').replace('px', '')) || 0

  const marginInfo: DomMarginInfo = {
    marginTop: convertRealPxValue(marginTop),
    marginBottom: convertRealPxValue(marginBottom),
  }
  return marginInfo
}

/**
 * 判断DOM元素是否在文档流中
 * @param dom 目标DOM元素
 * @returns 是否在文档流中
 */
export function getDomIsInDocumentFlow(dom: Element): boolean {
  const computedStyle = window.getComputedStyle(dom)

  // position为absolute或fixed时，元素脱离文档流
  const position = computedStyle.getPropertyValue('position')
  if (position === 'absolute' || position === 'fixed') {
    return false
  }

  // float不为none时，元素脱离文档流
  const float = computedStyle.getPropertyValue('float')
  if (float !== 'none') {
    return false
  }

  // display为none时，元素不在文档流中
  const display = computedStyle.getPropertyValue('display')
  if (display === 'none') {
    return false
  }

  // 其他情况认为在文档流中
  return true
}

export function getIsChildOfOutOfDocumentFlow(dom: Element): boolean {
  const parentNode = dom.parentElement
  if (!parentNode) {
    return false
  }
  if (!getDomIsInDocumentFlow(parentNode)) {
    return true
  }
  return getIsChildOfOutOfDocumentFlow(parentNode)
}

function getFixedNodeXByTextAlignment(textAlignment: TextAlignment, originX: number, deltaWidth: number) {
  if (textAlignment === 'left') {
    return originX
  }
  if (textAlignment === 'center') {
    return originX + deltaWidth / 2
  }
  if (textAlignment === 'right') {
    return originX + deltaWidth
  }
  return originX
}

export function getDomTextNodeFixedWidthAndPadding(nodeInfo: NodeInfo): NodeInfo {
  const { boundingRect, textStyleInfo, paddingInfo } = nodeInfo
  if (!textStyleInfo || textStyleInfo.textWidth === boundingRect.width) {
    return nodeInfo
  }
  const { textAlignment, textWidth } = textStyleInfo
  const deltaWidth = boundingRect.width - textWidth
  const fixedWidth = textStyleInfo.textWidth + paddingInfo.paddingLeft + paddingInfo.paddingRight
  const fixedX = getFixedNodeXByTextAlignment(textAlignment, boundingRect.x, deltaWidth)
  return {
    ...nodeInfo,
    boundingRect: {
      ...boundingRect,
      width: fixedWidth,
      x: fixedX,
    },
  }
}
