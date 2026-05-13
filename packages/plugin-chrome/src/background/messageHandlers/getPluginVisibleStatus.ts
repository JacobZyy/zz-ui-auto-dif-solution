import type { ChromeListenerMsgProcessorParams, ChromeListenerMsgResponse } from '@/types'
import { UI_DIFFER_VISIBLE_STORAGE } from '@/types'

export async function getPluginVisibleStatus(_configs: ChromeListenerMsgProcessorParams): Promise<ChromeListenerMsgResponse> {
  const result = await chrome.storage.session.get(UI_DIFFER_VISIBLE_STORAGE)
  return {
    success: true,
    message: '获取插件可见状态成功',
    data: !!result[UI_DIFFER_VISIBLE_STORAGE],
  }
}
