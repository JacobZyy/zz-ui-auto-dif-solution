import type { NodeWithChild } from '../types'
import { nodeWithChildSet } from '../types'

/**
 * 统一行高
 * @param node
 * @returns
 */
export function unifiedLineHeightValue(node: SceneNode): SceneNode {
  if (nodeWithChildSet.has(node.type)) {
    const reTypeNode = node as NodeWithChild
    return {
      ...reTypeNode,
      children: reTypeNode.children.map(child => unifiedLineHeightValue(child)),
    } as SceneNode
  }

  if (node.type !== 'TEXT') {
    return node
  }
  const { absoluteBoundingBox: originBoundingBox, textStyles, textAutoResize } = node
  const fontSizeList = textStyles.map(styleItem => styleItem.textStyle.fontSize).map(it => Number(it))
  const lineHeightList = textStyles.map(styleItem => styleItem.textStyle.lineHeightByPx).map(it => Number(it))
  const maxFontSize = Math.max(...fontSizeList)

  const maxLineHeight = Math.max(...lineHeightList)
  const originHeight = originBoundingBox.height
  // TODO: 只处理自适应高度或者自适应宽高的场景，非自适应宽高的场景比较复杂不做处理
  if (!maxLineHeight || !maxFontSize || originHeight === maxFontSize || textAutoResize === 'NONE')
    return node

  const isMultiLines = originHeight / maxLineHeight >= 2

  if (isMultiLines) {
    // 多行文本不处理行高（因为有行间距问题）
    return node
  }

  // lh 32, fz 22, delta = 10,
  const deltaHeight = originHeight - maxFontSize
  const newBoundingRect = {
    ...originBoundingBox,
    height: maxFontSize,
    y: originBoundingBox.y + deltaHeight / 2,
  }
  const result: SceneNode = {
    ...node,
    absoluteBoundingBox: newBoundingRect,
  }
  return result
}
