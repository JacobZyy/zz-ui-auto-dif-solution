import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

export function getTargetNodeTopFrame(currentNodeId: string) {
  const currentNode = mg.getNodeById(currentNodeId)
  if (!currentNode)
    return
  const currentPage = mg.document.currentPage
  const topFrames = currentPage.children
  const topFrameIdSet = topFrames.map(it => it.id)
  let currentParentNode: SceneNode = currentNode
  while (!topFrameIdSet.includes(currentParentNode.id) && !!currentParentNode.parent) {
    currentParentNode = currentParentNode.parent as SceneNode
  }
  sendPluginMsgToUI({ type: PluginMessage.TOP_PARENT_NODE, data: {
    id: currentParentNode.id,
    name: currentParentNode.name,
  } })
}
