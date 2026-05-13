import { v4 } from 'uuid'

/** 判断元素是否为纯行内元素（不包括 inline-block 等行内块元素） */
function getIsInlineNode(domNode: Element): boolean {
  const computedStyle = window.getComputedStyle(domNode)
  const isSettingInline = domNode instanceof HTMLElement && domNode.style.display === 'inline'
  return computedStyle.display === 'inline' || isSettingInline
}

/** 判断元素是否为浮动元素 */
function getIsFloat(domNode: Element): boolean {
  const computedStyle = window.getComputedStyle(domNode)
  return computedStyle.float !== 'none'
}

/**
 * 将文本节点包装在带有 unique-id 的 span 元素中
 * 使用内联样式重置所有可能的样式属性，避免被外部 CSS 影响
 * @param textNode - 要包装的文本节点
 * @param parentElement - 父元素
 */
function wrapTextNodeWithSpan(textNode: Text, parentElement: Element): void {
  // 创建包装的 span 元素
  const wrapper = document.createElement('span')
  wrapper.setAttribute('unique-id', v4())
  wrapper.setAttribute('data-text-wrapper', '1') // 标记这是文本包装器

  // 使用内联样式重置所有可能影响文本显示的样式属性
  // 这样可以确保 span 不会改变文本的任何视觉表现
  wrapper.style.cssText = `
    display: inline !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    font: inherit !important;
    color: inherit !important;
    text-decoration: inherit !important;
    text-transform: inherit !important;
    letter-spacing: inherit !important;
    word-spacing: inherit !important;
    text-align: inherit !important;
    vertical-align: inherit !important;
    white-space: inherit !important;
    overflow: inherit !important;
    position: static !important;
    float: none !important;
    clear: none !important;
    visibility: inherit !important;
    opacity: inherit !important;
    z-index: auto !important;
    box-shadow: none !important;
    outline: none !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
    line-height: 1em !important;
  `.replace(/\s+/g, ' ').trim()

  // 将文本节点移动到 span 中
  wrapper.appendChild(textNode.cloneNode(true))

  // 替换原文本节点
  parentElement.replaceChild(wrapper, textNode)
}

export function wrapperTextNodeWithSpan(domNode: Element): void {
  const children = Array.from(domNode.children)
  // .filter(childNode => !!getDomIsInDocumentFlow(childNode))
  children.forEach((child) => {
    return wrapperTextNodeWithSpan(child)
  })
  // 是否有文本节点
  const textChildNodeList = Array.from(domNode.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim())
  if (!textChildNodeList?.length) {
    // 无文本，跳过
    return
  }

  const isCurrentTextWrapper = domNode.getAttribute('data-text-wrapper') === '1'
  if (isCurrentTextWrapper) {
    // 已经是文本包装器，跳过
    return
  }

  // 是否是行内节点
  const isInlineNode = getIsInlineNode(domNode)
  // 是否是行内节点且全为文本节点
  const isAllTextNode = textChildNodeList.every(node => node.nodeType === Node.TEXT_NODE)
  const hasSpecialSiblingNode = Array.from(domNode.parentElement?.children || []).some((node) => {
    if (node === domNode)
      return false
    // 是否有兄弟节点是图片
    const isImage = node.tagName === 'IMG'
    // 是否有兄弟节点是inline节点
    const isInlineNode = getIsInlineNode(node)
    // 是否有兄弟节点是float节点
    const isFloat = getIsFloat(node)
    return isImage || isInlineNode || isFloat
  })

  // 行内节点且子节点全为文本节点且没有兄弟节点是图片
  if (isInlineNode && isAllTextNode && !hasSpecialSiblingNode) {
    // 行内元素变成行内块元素
    (domNode as HTMLElement).style.display = 'inline-block'
  }

  textChildNodeList.forEach((textNode) => {
    return wrapTextNodeWithSpan(textNode as Text, domNode)
  })
}
