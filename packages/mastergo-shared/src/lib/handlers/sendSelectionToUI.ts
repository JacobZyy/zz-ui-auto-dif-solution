import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

export async function sendSelectionToUI() {
  const selection = mg.document.currentPage.selection
  sendPluginMsgToUI({ type: PluginMessage.SELECTION_CHANGE, data: selection })
}
