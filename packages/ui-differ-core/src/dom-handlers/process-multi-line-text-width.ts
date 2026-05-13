import type { NodeInfo } from '../types'
import { produce } from 'immer'

export function processMultiLineTextWidth(flatNodeMap: Map<string, NodeInfo>) {
  const newFlatNodeMap = produce(flatNodeMap, (draftFlatNodeMap) => {
    draftFlatNodeMap.forEach((currentNodeInfo) => {
      const childLen = currentNodeInfo.children.length
      if (childLen !== 1) {
        return
      }
      const childNodeInfo = draftFlatNodeMap.get(currentNodeInfo.children[0])
      if (!childNodeInfo?.textStyleInfo) {
        return
      }
      const isChildTextNode = childNodeInfo.isTextWrapper
      const isMultiLineText = childNodeInfo.textStyleInfo.textLineCount > 1
      if (!isChildTextNode || !isMultiLineText) {
        return
      }
      // 当且仅当当前节点的子节点为文本节点，且行数大于1行时
      // 让子节点文本节点的宽度等于当前节点的宽度
      childNodeInfo.boundingRect.width = currentNodeInfo.boundingRect.width
      childNodeInfo.boundingRect.x = currentNodeInfo.boundingRect.x
    })
  })
  return newFlatNodeMap
}
