import type { NodeInfo, UniqueId } from '../types'
import { produce } from 'immer'

export const filterEmptyNodeAndOutOfDocumentFlowNodes = produce((draftNodeMap: Map<UniqueId, NodeInfo>) => {
  draftNodeMap.forEach((currentNodeInfo) => {
    if (currentNodeInfo.isEmptyNode) {
      draftNodeMap.delete(currentNodeInfo.uniqueId)
      return
    }
    currentNodeInfo.children = currentNodeInfo.children.filter((childId) => {
      const child = draftNodeMap.get(childId)
      return !!child && !child.isEmptyNode
    })
    currentNodeInfo.sibling = currentNodeInfo.sibling.filter((siblingId) => {
      const sibling = draftNodeMap.get(siblingId)
      return !!sibling && !sibling.isEmptyNode
    })
  })
})
