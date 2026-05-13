import type { PluginMessage, UIMessage } from './type'

// interface MessageType {
//   type: UIMessage | PluginMessage
//   data?: any
// }

export interface PluginMessageType<T = any> {
  type: PluginMessage
  data?: T
}

export interface UIMessageType<T = any> {
  type: UIMessage
  data?: T
}

/**
 * 向UI发送消息
 */
export function sendPluginMsgToUI<T = any>(data: PluginMessageType<T>) {
  mg.ui.postMessage(data, '*')
}

/**
 * UI向插件发送消息
 */
export function sendUIMsgToPlugin<T = any>(data: UIMessageType<T>) {
  parent.postMessage(data, '*')
}
