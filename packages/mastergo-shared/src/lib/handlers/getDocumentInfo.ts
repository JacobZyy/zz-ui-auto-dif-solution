import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

export function getDocumentInfo() {
  sendPluginMsgToUI({ type: PluginMessage.DOCUMENT_INFO, data: {
    document: {
      id: mg.document.id,
      name: mg.document.name,
    },
    currentPage: {
      id: mg.document.currentPage.id,
      name: mg.document.currentPage.name,
    },
  } })
}
