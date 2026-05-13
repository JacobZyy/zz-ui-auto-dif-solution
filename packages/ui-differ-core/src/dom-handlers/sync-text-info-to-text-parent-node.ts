import type { NodeInfo } from '../types'
import { produce } from 'immer'

/**
 * 同步文本信息到文本父节点
 * @param flatNodeMap 扁平化dom节点map
 * @returns
 */
export async function syncTextInfoToTextParentNode(flatNodeMap: Map<string, NodeInfo>) {
  console.log('🚀 ~ syncTextInfoToTextParentNode ~ flatNodeMap:', flatNodeMap)
  const result = produce(flatNodeMap, (draftFlatNodeMap) => {
    const keys = Array.from(draftFlatNodeMap.keys())
    const reversedKeys = keys.toReversed()
    reversedKeys.forEach((currentNodeId) => {
      const currentNode = draftFlatNodeMap.get(currentNodeId)
      if (!currentNode) {
        return
      }
      const dataTextWrapperChildIds = currentNode.children.map(id => draftFlatNodeMap.get(id)).filter(it => it?.isTextWrapper || it?.tagName === 'INPUT')
      const childFontSizeList = dataTextWrapperChildIds.map(child => child?.textStyleInfo?.fontSize).filter(it => it !== undefined)
      if (!childFontSizeList?.length)
        return
      const maxFontSize = Math.max(...childFontSizeList)
      const targetTextChild = dataTextWrapperChildIds.find(child => child?.textStyleInfo?.fontSize === maxFontSize)
      currentNode.textStyleInfo = targetTextChild?.textStyleInfo
    })
  })
  return result
}
