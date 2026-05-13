import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'

export const processLargeLineHeight = produce((draftNodeMap: Map<UniqueId, NodeInfo>) => {
  draftNodeMap.forEach((nodeInfo) => {
    const { textStyleInfo, boundingRect, paddingInfo, isInlineNode, parentId } = nodeInfo
    if (!textStyleInfo) {
      return
    }

    const parentNodeInfo = draftNodeMap.get(parentId)
    if (isInlineNode && !!parentNodeInfo) {
      nodeInfo.boundingRect.y = parentNodeInfo.boundingRect.y
      nodeInfo.boundingRect.height = parentNodeInfo.boundingRect.height
      return
    }

    const { fontSize, textLineCount } = textStyleInfo
    const { paddingBottom, paddingTop } = paddingInfo
    const realHeight = boundingRect.height - paddingBottom - paddingTop

    if (textLineCount > 1 || fontSize === realHeight) {
      return
    }
    const deltaValue = realHeight - fontSize
    nodeInfo.boundingRect.y = boundingRect.y + deltaValue / 2
    nodeInfo.boundingRect.height = fontSize + paddingTop + paddingBottom
  })
})
