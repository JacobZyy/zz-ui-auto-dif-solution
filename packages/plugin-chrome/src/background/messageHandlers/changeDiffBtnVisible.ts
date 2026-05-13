import type { ChromeListenerMsgProcessorParams } from '@/types'

export async function changeDiffBtnVisible(configs: ChromeListenerMsgProcessorParams) {
  const { message } = configs
  return {
    success: true,
    message: '设置成功',
    data: message,
  }
}
