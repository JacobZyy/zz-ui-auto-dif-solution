import type { NodeWithChild } from '../types'
import { nodeWithChildSet } from '../types'

/**
 * 合并切图节点(递归处理整个树)
 * 当前节点的子节点中有切图节点时,将其余子节点的visible设置为false
 * 递归处理所有子节点
 */
export function combineSliceLayers<T extends SceneNode>(rootNode: T): T {
  const hasChildren = nodeWithChildSet.has(rootNode.type)
  if (!hasChildren) {
    return rootNode
  }

  const childNodeList = Array.from((rootNode as NodeWithChild).children)

  // 先递归处理所有子节点
  const processedChildren = childNodeList.map(child => combineSliceLayers(child))

  // 检查是否有切图节点
  const hasSliceNode = processedChildren.some(child => child.type === 'SLICE')

  // 如果没有切图节点,返回处理后的子节点
  if (!hasSliceNode) {
    return {
      ...rootNode,
      children: processedChildren,
    } as T
  }

  // 如果有切图节点,将其他子节点的visible设置为false
  return {
    ...rootNode,
    children: processedChildren.map((child) => {
      if (child.type === 'SLICE')
        return child
      return {
        ...child,
        isVisible: false,
      }
    }),
  } as T
}
