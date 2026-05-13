export function locateTargetNode(targetNodeId: string) {
  const targetNodeInfo = mg.getNodeById(targetNodeId)
  if (!targetNodeInfo) {
    return
  }
  const { absoluteBoundingBox } = targetNodeInfo
  const { x, y, width, height } = absoluteBoundingBox
  const centerX = x + Math.floor(width / 2)
  const centerY = y + Math.floor(height / 2)
  mg.viewport.center = { x: centerX, y: centerY }
  mg.viewport.zoom = 1.5
  mg.document.currentPage.selection = [targetNodeInfo]
}
