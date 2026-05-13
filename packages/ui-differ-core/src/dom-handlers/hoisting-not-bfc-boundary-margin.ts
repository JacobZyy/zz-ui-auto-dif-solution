import type { BorderInfo, DomMarginInfo, PaddingInfo } from '../types'
import { camel } from 'radash'
import { getDomBackgroundColor, getDomBorderInfo, getDomIsBfc, getDomPaddingInfo, getPxValue } from '../utils'

/**
 * 检查是否是 flex 或 grid 的子元素
 */
function getIsFlexOrGridItem(domNode: HTMLElement): boolean {
  const parentElement = domNode.parentElement
  if (!parentElement)
    return false

  const parentDisplay = window.getComputedStyle(parentElement).display
  return ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(parentDisplay)
}
/**
 * 检查是否包含 inline 内容
 */
function getHasInlineContent(domNode: HTMLElement): boolean {
  return Array.from(domNode.childNodes).some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() !== ''
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const childDisplay = window.getComputedStyle(node as Element).display
      return childDisplay.startsWith('inline')
    }
    return false
  })
}
/**
 * 检查是否有 clearance
 */
function getHasClearance(domNode: HTMLElement): boolean {
  const clear = window.getComputedStyle(domNode).getPropertyValue('clear')
  return clear !== 'none'
}

/**
 * 判断dom节点的对应方向是否需要做margin提升（提升至父节点）
 * @returns {boolean}: 是否需要提升margin, true: 需要提升margin, false: 不需要提升margin
 */
function judgeDomNodeMarginHoisting(domNode: HTMLElement, position: 'top' | 'bottom'): boolean {
  const paddingInfo = getDomPaddingInfo(domNode)
  const backgroundColor = getDomBackgroundColor(domNode)
  const broderInfo = getDomBorderInfo(domNode)

  const paddingKey = camel(`padding ${position}`) as keyof PaddingInfo
  const borderKey = camel(`border ${position}`) as keyof BorderInfo
  const borderInfo = broderInfo?.[borderKey]

  const hasTargetDirectionPadding = !!paddingInfo?.[paddingKey]
  const hasTargetBorderInfo = !!borderInfo?.width && !!borderInfo?.color && borderInfo.color !== 'transparent' && borderInfo.color !== backgroundColor && borderInfo.from === 'normal'
  return !hasTargetDirectionPadding && !hasTargetBorderInfo
}
/**
 * 提升dom节点的对应方向的margin
 */
function hostingTargetDirectionMargin(domNode: HTMLElement, position: 'top' | 'bottom') {
  const domNodeStyle = window.getComputedStyle(domNode)
  if (domNodeStyle.display === 'inline') {
    domNode.style.display = 'block'
  }
  // top: 第一个子元素的 margin-top
  // bottom: 最后一个子元素的 margin-bottom
  const notEmptyChildList = Array.from(domNode.children).filter((childNode) => {
    const computedStyle = window.getComputedStyle(childNode)
    return computedStyle.display !== 'none' && !!getPxValue(computedStyle.height)
  })
  if (!notEmptyChildList.length)
    return
  const targetIdx = position === 'top' ? 0 : notEmptyChildList.length - 1
  const targetChild = notEmptyChildList[targetIdx] as HTMLElement
  const marginKey = camel(`margin-${position}`) as keyof DomMarginInfo
  const childStyle = window.getComputedStyle(targetChild)
  const marginValue = getPxValue(childStyle[marginKey])
  if (!marginValue)
    return

  const originMarginValue = getPxValue(domNodeStyle[marginKey])
  targetChild.style[marginKey] = '0'

  if (originMarginValue * marginValue <= 0) {
    // 一正一负，直接相加 or 原来为0
    domNode.style[marginKey] = `${originMarginValue + marginValue}px`
    return
  }

  // 同号 取绝对值大的
  const targetKey = originMarginValue > 0 ? 'max' : 'min'
  const absLargeMarginValue = Math[targetKey](originMarginValue, marginValue)
  // 重置子节点的margin
  // 添加父节点的margin
  domNode.style[marginKey] = `${absLargeMarginValue}px`
}

export function hoistingNotBfcBoundaryMargin(domNode: HTMLElement) {
  Array.from(domNode.children).forEach((childNode) => {
    // 反向DFS，先走最内部节点，然后往外走
    hoistingNotBfcBoundaryMargin(childNode as HTMLElement)
  })
  const isBFC = getDomIsBfc(domNode)
  const isFlexOrGridItem = getIsFlexOrGridItem(domNode)
  const hasInlineContent = getHasInlineContent(domNode)
  const hasClearance = getHasClearance(domNode)
  const childNodeList = Array.from(domNode.children).filter((childNode) => {
    const isDataTextWrapper = childNode.getAttribute('data-text-wrapper') === '1'
    return !isDataTextWrapper
  })

  // 全部为false才需要提升margin
  const preJudgeResult = [isBFC, isFlexOrGridItem, hasInlineContent, hasClearance, !childNodeList.length].every(it => !it)
  if (!preJudgeResult) {
    return
  }
  const shouldHoistTopMargin = judgeDomNodeMarginHoisting(domNode, 'top')
  const shouldHoistBottomMargin = judgeDomNodeMarginHoisting(domNode, 'bottom')

  if (shouldHoistTopMargin) {
    hostingTargetDirectionMargin(domNode, 'top')
  }
  if (shouldHoistBottomMargin) {
    hostingTargetDirectionMargin(domNode, 'bottom')
  }
}
