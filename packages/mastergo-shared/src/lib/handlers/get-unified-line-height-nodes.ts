import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 统一行高检测：遍历整棵树，收集所有行高 > 字号的单行文本节点
 */
export function getUnifiedLineHeightNodes(data?: { targetNodeId?: string }) {
  const targetNodeId = data?.targetNodeId || mg.document.currentPage.selection[0]?.id
  if (!targetNodeId)
    return sendPluginMsgToUI({ type: PluginMessage.UNIFIED_LINE_HEIGHT_NODES, data: { success: false, nodes: [] } })

  const targetNode = mg.getNodeById(targetNodeId)
  if (!targetNode)
    return sendPluginMsgToUI({ type: PluginMessage.UNIFIED_LINE_HEIGHT_NODES, data: { success: false, nodes: [] } })

  const result: { nodeId: string, nodeName: string, description: string }[] = []
  const queue: SceneNode[] = [targetNode]

  while (queue.length > 0) {
    const node = queue.shift()
    if (!node)
      continue

    if (node.type === 'TEXT') {
      const textNode = node as TextNode
      const textStyles: TextSegStyle[] = (textNode as TextNode & { textStyles?: TextSegStyle[] }).textStyles || []
      const fontSizeList = textStyles
        .map((s: TextSegStyle) => s.textStyle?.fontSize)
        .filter(Boolean)
        .map(Number)
      const lineHeightList = textStyles
        .map((s: TextSegStyle) => s.textStyle?.lineHeightByPx)
        .filter(Boolean)
        .map(Number)

      if (fontSizeList.length && lineHeightList.length) {
        const maxFontSize = Math.max(...fontSizeList)
        const maxLineHeight = Math.max(...lineHeightList)
        const bbox = textNode.absoluteBoundingBox
        if (maxLineHeight > maxFontSize) {
          const isMultiLines = bbox && bbox.height / maxLineHeight >= 2
          if (!isMultiLines) {
            result.push({
              nodeId: node.id,
              nodeName: node.name,
              description: `字号 ${maxFontSize}px，行高 ${maxLineHeight}px，单行文本`,
            })
          }
        }
      }
    }

    if ('children' in node && node.children) {
      Array.from(node.children).forEach(child => queue.push(child))
    }
  }

  sendPluginMsgToUI({ type: PluginMessage.UNIFIED_LINE_HEIGHT_NODES, data: { success: true, nodes: result } })
}
