import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

export async function getPreviewImg() {
  try {
    const selection = mg.document.currentPage.selection
    if (!selection.length) {
      sendPluginMsgToUI({ type: PluginMessage.PREVIEW_IMAGE, data: null })
      return
    }
    const imageUnit8Array = await selection[0].exportAsync({ format: 'PNG' })

    const msgData = {
      imgUnit8Array: imageUnit8Array,
      selectionWidth: selection[0].absoluteBoundingBox.width,
      selectionHeight: selection[0].absoluteBoundingBox.height,
    }
    sendPluginMsgToUI({ type: PluginMessage.PREVIEW_IMAGE, data: msgData })
  }
  catch (error) {
    console.log(error)
  }
}
