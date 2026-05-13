import type { BoundingRect, NodeFlexInfo, NodeInfo } from '../types'
import type {
  ElementSizeConstraintResult,
} from '../utils'
import { clone } from 'radash'
import { domConfigs } from '../stores'
import { DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH, ignoreChildrenClsSet, shouldSkipShrinkBoundingTagNameSet } from '../types'
import {
  floorOrderTraversalWithDom,
  getDomBackgroundColor,
  getDomBorderInfo,
  getDomIsBfc,
  getDomIsInDocumentFlow,
  getDomNodeAlignment,
  getDomPaddingInfo,
  getDomTextNodeFixedWidthAndPadding,
  getDomTextStyleInfo,
  getIsChildOfOutOfDocumentFlow,
} from '../utils'

export function processSingleDomNodeInfo(domNode: HTMLElement) {
  const rootBounding = domConfigs.getRootBounding() || { x: 0, y: 0, width: DEFAULT_PAGE_WIDTH, height: DEFAULT_PAGE_HEIGHT }
  const nodeId = domNode.getAttribute('unique-id')
  const computedStyle = window.getComputedStyle(domNode)
  if (!nodeId)
    return
  const boundingRect = domNode.getBoundingClientRect()

  const realBoundingRect: BoundingRect = {
    x: boundingRect.x - rootBounding.x,
    y: boundingRect.y - rootBounding.y,
    width: boundingRect.width,
    height: boundingRect.height,
  }

  const nodeName = `.${Array.from(domNode.classList.values()).join('.')}`

  // 获取子节点id
  const childrenIds = Array.from(domNode.children)
    // 在文档流中并且有unique-id的子节点
    // .filter(childNode => getDomIsInDocumentFlow(childNode))
    .filter((childNode) => {
      const clsList = Array.from(childNode.classList.values())
      return !(clsList.some(cls => ignoreChildrenClsSet.has(cls)))
    })
    .map(child => child.getAttribute('unique-id'))
    .filter(it => it !== null)
  // 这个不用判断，因为脱离文档流的节点及其子节点都会被一次性过滤
  const parentId = domNode.parentElement?.getAttribute('unique-id')
  const siblingIds = Array.from(domNode.parentElement?.children || [])
    .filter(siblingNode => getDomIsInDocumentFlow(siblingNode))
    .filter((childNode) => {
      const clsList = Array.from(childNode.classList.values())
      return !(clsList.some(cls => ignoreChildrenClsSet.has(cls)))
    })
    .map(sibling => sibling.getAttribute('unique-id'))
    .filter(id => id !== nodeId)
    .filter(id => id != null)
  const borderInfo = getDomBorderInfo(domNode)
  const paddingInfo = getDomPaddingInfo(domNode)
  const backgroundColor = getDomBackgroundColor(domNode)
  const isBFC = getDomIsBfc(domNode)
  const isInDocumentFlow: boolean = getDomIsInDocumentFlow(domNode)
  const isChildOfOutOfDocumentFlow: boolean = !isInDocumentFlow || getIsChildOfOutOfDocumentFlow(domNode)
  const textStyleInfo = getDomTextStyleInfo(domNode)
  const isTextDataWrapper = !!Number(domNode.getAttribute('data-text-wrapper'))
  const domAlignment = getDomNodeAlignment(domNode)

  const isSpecialNode = shouldSkipShrinkBoundingTagNameSet.has(domNode.tagName)

  // const isOutOfViewport = realBoundingRect.x > DEFAULT_PAGE_WIDTH || realBoundingRect.y > DEFAULT_PAGE_HEIGHT || realBoundingRect.x + realBoundingRect.width < 0 || realBoundingRect.y + realBoundingRect.height < 0
  // NOTE: 仅判断X轴方向
  const isOutOfViewport = realBoundingRect.x > DEFAULT_PAGE_WIDTH || realBoundingRect.x + realBoundingRect.width < 0
  // 过滤空节点
  // 是否有子节点需要从dom节点中获取，防止被过滤子节点逻辑判空的节点情况
  const hasNoChild = !Array.from(domNode.children)?.length
  const emptyText = !textStyleInfo?.textContent
  const transparentBg = backgroundColor !== 'background-image'
  const noneBorder = Object.values(borderInfo || {}).every(it => !it.width || it.color === 'transparent')
  // 有单侧尺寸，且有边框 -> 分割线
  const isDivider = ((realBoundingRect.width && realBoundingRect.height <= 1) || (realBoundingRect.width <= 1 && realBoundingRect.height)) && (!noneBorder || backgroundColor !== 'transparent')
  // 有宽高，且有背景色，且没有子节点，且没有文本 -> 背景色节点
  const isBackgroundColorNode = !!realBoundingRect.height && !!realBoundingRect.width && !transparentBg && hasNoChild && emptyText
  /**
   * 1. 非背景节点
   * 2. 非divider节点
   */
  const isEmptyNode = !isSpecialNode && !isBackgroundColorNode && !isDivider && hasNoChild && emptyText
  const nodeFlexInfo: NodeFlexInfo = {
    isFlex: computedStyle.display === 'flex',
    flexDirection: computedStyle.flexDirection ?? 'row',
    flexWrap: computedStyle.flexWrap ?? 'nowrap',
    justifyContent: computedStyle.justifyContent,
    alignItems: computedStyle.alignItems,
    flexShrink: computedStyle.flexShrink,
    flexGrow: computedStyle.flexGrow,
    flexBasis: computedStyle.flexBasis,
  }

  const listElementTag = domNode.getAttribute('list-node-tag') || ''
  const zzUITag = domNode.getAttribute('zz-ui-tag') || ''

  const elementSizeConstraintResult: ElementSizeConstraintResult = {
    isHeightConstrained: domNode.getAttribute('height-constrained') === '1',
    isWidthConstrained: domNode.getAttribute('width-constrained') === '1',
  }

  if (isTextDataWrapper) {
    elementSizeConstraintResult.isHeightConstrained = true
  }

  const newNode: NodeInfo = {
    nodeName,
    uniqueId: nodeId,
    boundingRect: realBoundingRect,
    originBounding: clone(realBoundingRect),
    parentId: parentId || '',
    children: childrenIds,
    sibling: siblingIds,
    borderInfo,
    paddingInfo,
    backgroundColor,
    neighborMarginInfo: {},
    initialNeighborInfos: {},
    isBFC,
    isOutOfDocumentFlow: !isInDocumentFlow,
    isChildOfOutOfDocumentFlow,
    nodeFlexInfo,
    textStyleInfo,
    isEmptyNode,
    isBackgroundColorNode,
    shouldSkipShrinkBounding: false,
    isInlineNode: computedStyle.display === 'inline',
    isTextWrapper: isTextDataWrapper,
    tagName: domNode.tagName,
    isOutOfViewport,
    listElementTag,
    isZZUI: !!zzUITag,
    alignment: domAlignment,
    elementSizeConstraintResult,
  }
  const fixedTextStyleNode = getDomTextNodeFixedWidthAndPadding(newNode)
  return fixedTextStyleNode
}

/** 打平dom树，绑定当前节点的父节点、子节点、兄弟节点信息（仅需要uniqueId）以及当前节点的boundingRect */
export async function onDomInfoRecorder(rootDom: HTMLElement) {
  const floorOrderDomList = Array.from(floorOrderTraversalWithDom(rootDom))
  const flatNodeMapEntries = floorOrderDomList.map((domNode) => {
    const nodeInfo = processSingleDomNodeInfo(domNode as HTMLElement)
    if (!nodeInfo) {
      return null
    }
    return [nodeInfo?.uniqueId, nodeInfo] as const
  }).filter(it => it !== null)
  const flatNodeMap = new Map(flatNodeMapEntries)
  return flatNodeMap
}
