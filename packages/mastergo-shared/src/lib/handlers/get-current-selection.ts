import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 获取当前选择信息并发送给 UI
 * 用于进入检测页时获取选中的节点
 */
export function getCurrentSelection() {
  const selection = mg.document.currentPage.selection
  const selectedNode = selection?.[0]
  sendPluginMsgToUI({
    type: PluginMessage.CURRENT_SELECTION,
    data: selectedNode ? { id: selectedNode.id, name: selectedNode.name } : null,
  })
}
