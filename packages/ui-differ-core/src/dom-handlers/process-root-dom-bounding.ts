import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'

export function processRootDomBounding({ flatNodeMap, isPartDiff }: { flatNodeMap: Map<UniqueId, NodeInfo>, isPartDiff: boolean }) {
  if (!isPartDiff) {
    return flatNodeMap
  }
  const rootBoundingOffset = {
    x: 0,
    y: 0,
  }

  const rootNode = flatNodeMap.get(Array.from(flatNodeMap.keys())[0])
  rootBoundingOffset.x = rootNode?.boundingRect?.x || 0
  rootBoundingOffset.y = rootNode?.boundingRect?.y || 0

  return produce(flatNodeMap, (draftFlatNodeMap) => {
    draftFlatNodeMap.forEach((nodeInfo) => {
      nodeInfo.boundingRect.x -= rootBoundingOffset.x
      nodeInfo.boundingRect.y -= rootBoundingOffset.y
    })
  })
}
