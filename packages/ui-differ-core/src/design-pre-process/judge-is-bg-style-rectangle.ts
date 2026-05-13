export function judgeIsBgStyleRectangle(currentNode: PenNode | RectangleNode, parentNode: FrameNode | GroupNode) {
  const { width, height } = currentNode
  const { width: parentWidth, height: parentHeight } = parentNode
  const deltaWidth = Math.abs(width - parentWidth)
  const deltaHeight = Math.abs(height - parentHeight)
  // 大于为图片 + mask 或者 图片+overflow hidden的场景
  const isSameSize = deltaWidth < 2 && deltaHeight < 2
  return isSameSize
}
