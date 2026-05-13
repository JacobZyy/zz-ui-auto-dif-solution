import { v4 } from 'uuid'

/**
 * 为 DOM 树中的所有节点（包括文本节点）添加唯一标识符
 * 文本节点只有在其兄弟节点中存在非文本节点时才会被包装在 span 元素中
 * @param rootDom - 根节点元素
 */
export function initialDomUUID(rootDom: Element): void {
  // 如果节点已经有 unique-id，则跳过
  if (!rootDom.getAttribute('unique-id')) {
    rootDom.setAttribute('unique-id', v4())
  }
  // 处理所有子节点（包括文本节点）
  const children = Array.from(rootDom.children)

  children.forEach((child) => {
    return initialDomUUID(child as Element)
  })
}
