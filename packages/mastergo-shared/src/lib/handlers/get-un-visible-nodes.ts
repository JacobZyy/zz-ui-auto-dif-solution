import type { NodeWithChild, NodeWithoutFillsAndStrokes } from '@ui-differ/core'
import { nodeNoChildSet, nodeWithoutFillsAndStrokesSet } from '@ui-differ/core'
import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

function isNodeUnVisible(node: SceneNode) {
  // 直接的隐藏节点
  if (!node.isVisible) {
    return true
  }
  if (nodeWithoutFillsAndStrokesSet.has(node.type)) {
    return false
  }
  const reTypedNode = node as Exclude<SceneNode, NodeWithoutFillsAndStrokes | SectionNode>
  const { fills, strokes, isMask, isMaskVisible } = reTypedNode
  // 没有可见的背景色
  const isNoVisibleFills = !!fills?.length && fills.every(it => !it.isVisible)
  // 没有可见的边框
  const isNoVisibleStrokes = !!strokes?.length && strokes.every(it => !it.isVisible)
  const isMaskNotVisible = isMask && !isMaskVisible
  return isNoVisibleFills && isNoVisibleStrokes && isMaskNotVisible
}

function* getUnVisibleNodeList(rootNode: SceneNode) {
  const queue: SceneNode[] = [rootNode]

  while (queue.length > 0) {
    const currentNode = queue.shift()
    if (!currentNode || currentNode.type === 'INSTANCE')
      continue
    // 产出当前节点
    yield currentNode
    if (nodeNoChildSet.has(currentNode.type)) {
      continue
    }
    const isCurrentUnVisible = isNodeUnVisible(currentNode)
    // 忽略隐藏节点的子节点
    if (isCurrentUnVisible) {
      continue
    }
    // 将所有子元素节点加入队列
    const children = Array.from((currentNode as NodeWithChild).children || [])
    queue.push(...children)
  }
}

/**
 * @description 获取被隐藏的节点列表
 */
export async function getUnVisibleNodes() {
  const selection = mg.document.currentPage.selection
  if (!selection)
    return
  const singleNode = selection[0]
  const currentNodeList = Array.from(getUnVisibleNodeList(singleNode))
  const unVisibleNodeList = currentNodeList.filter(isNodeUnVisible).map(it => ({ id: it.id, name: it.name }))
  sendPluginMsgToUI({ type: PluginMessage.UN_VISIBLE_NODES, data: unVisibleNodeList })
}
