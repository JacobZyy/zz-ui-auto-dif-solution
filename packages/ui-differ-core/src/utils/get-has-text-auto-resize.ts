import type { NodeInfo } from '../types'

const AUTO_RESIZE_TEXT_AUTO_RESIZE = new Set<TextNode['textAutoResize']>([
  'HEIGHT',
  'NONE',
])

export function getHasTextAutoResize(designNodeList: NodeInfo[]) {
  return designNodeList.some(nodeInfo => !!nodeInfo.textStyleInfo?.textAutoResize && AUTO_RESIZE_TEXT_AUTO_RESIZE.has(nodeInfo.textStyleInfo?.textAutoResize) && nodeInfo.textStyleInfo?.lineHeight <= 1)
}
