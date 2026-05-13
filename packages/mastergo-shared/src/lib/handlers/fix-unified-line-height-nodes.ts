import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 统一行高：单行文本行高大于字号时，把高度压到字号
 */
export async function fixUnifiedLineHeightNodes(data?: { targetNodeId?: string, nodeIdList?: string[] }) {
  const nodeIdList = data?.nodeIdList ?? []
  if (!nodeIdList.length)
    return sendPluginMsgToUI({ type: PluginMessage.UNIFIED_LINE_HEIGHT_FIXED, data: { success: false, fixedCount: 0 } })

  let totalFixed = 0
  for (const nodeId of nodeIdList) {
    const node = mg.getNodeById(nodeId) as SceneNode | null
    if (!node || node.type !== 'TEXT')
      continue

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

    if (!fontSizeList.length || !lineHeightList.length)
      continue

    const maxFontSize = Math.max(...fontSizeList)
    const maxLineHeight = Math.max(...lineHeightList)
    if (maxLineHeight <= maxFontSize)
      continue

    const bbox = textNode.absoluteBoundingBox
    if (bbox && bbox.height / maxLineHeight >= 2)
      continue

    ;(textNode as LayoutMixin).height = maxFontSize
    totalFixed++
  }

  sendPluginMsgToUI({ type: PluginMessage.UNIFIED_LINE_HEIGHT_FIXED, data: { success: true, fixedCount: totalFixed } })
}
