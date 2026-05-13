import type { PluginMessageType } from '@ui-differ/mastergo-shared/lib'
import { PluginMessage, sendUIMsgToPlugin, UIMessage } from '@ui-differ/mastergo-shared/lib'
import { useMemoizedFn } from 'ahooks'
import { OperationBannerItem } from '../operation-banner-item'

export function RemoveUselessLayers() {
  /** 获取无用图层 */
  const onGetUselessLayerSender = useMemoizedFn(() => {
    sendUIMsgToPlugin({ type: UIMessage.GET_UN_VISIBLE_NODES, data: null })
  })
  /** 监听插件发回来的消息，返回节点数组 */
  const onGetUselessLayerListener = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.UN_VISIBLE_NODES) {
      return []
    }
    if (!data) {
      return []
    }
    return Array.isArray(data) ? data : []
  })

  const handleRemoveUselessLayer = useMemoizedFn((nodeList: SceneNode[]) => {
    const nodeIdList = nodeList.map(it => it.id)
    sendUIMsgToPlugin({ type: UIMessage.CLEAR_UN_VISIBLE_NODES, data: nodeIdList })
  })

  return (
    <OperationBannerItem
      uiMsgProcessor={onGetUselessLayerListener}
      uiMsgSender={onGetUselessLayerSender}
      onFixHandler={handleRemoveUselessLayer}
      title="移除无用图层"
      subtitle="以避免影响其他元素排列"
      itemIdx={1}
    />
  )
}
