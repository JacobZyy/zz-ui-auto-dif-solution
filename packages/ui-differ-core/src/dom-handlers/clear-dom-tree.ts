import { shouldSkipShrinkBoundingTagNameSet } from '../types'
import { processSingleDomNodeInfo } from './dom-info-recorder'

/**
 * 清理 DOM 树的无效结构
 * @param domNode - 根节点元素
 */
export function clearDomTree(domNode: Element): void {
  const children = Array.from(domNode.children)
  children.forEach((child) => {
    clearDomTree(child)
  })

  const zzUITag = domNode.getAttribute('zz-ui-tag')
  if (zzUITag) {
    return
  }

  if (shouldSkipShrinkBoundingTagNameSet.has(domNode.tagName.toUpperCase())) {
    return
  }
  const computedStyle = window.getComputedStyle(domNode)
  const isDisplayNone = computedStyle.display === 'none'
  const currentNodeInfo = processSingleDomNodeInfo(domNode as HTMLElement)
  if (currentNodeInfo?.isEmptyNode || isDisplayNone) {
    domNode.remove()
    return
  }

  domNode.childNodes.forEach((node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove()
    }
  })

  const isAllTextNodes = Array.from(domNode.childNodes).every(node => node.nodeType === Node.TEXT_NODE)
  if (!isAllTextNodes) {
    return
  }
  const textContent = domNode.textContent
  // 合并所有文本节点为一个
  domNode.textContent = ''
  domNode.appendChild(document.createTextNode(textContent || ''))
}
