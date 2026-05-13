import type { PluginMessageType } from '@ui-differ/mastergo-shared/lib'
import { PluginMessage, sendUIMsgToPlugin, UIMessage } from '@ui-differ/mastergo-shared/lib'
import { useMemoizedFn } from 'ahooks'
import { useDetectPageStore } from '@/stores'
import { OperationBannerItem, type OperationNodeItem } from '../operation-banner-item'

interface PluginNodeRaw {
  nodeId: string
  nodeName: string
  description: string
}

interface CombineSliceLayerProps {
  itemIdx: number
}

export function CombineSliceLayer({ itemIdx }: CombineSliceLayerProps) {
  const targetRootNodeId = useDetectPageStore(state => state.targetRootNodeId)

  const onGetSliceLayerSender = useMemoizedFn(() => {
    sendUIMsgToPlugin({ type: UIMessage.GET_COMBINE_SLICE_NODES, data: { targetNodeId: targetRootNodeId } })
  })

  const onGetSliceLayerListener = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.COMBINE_SLICE_NODES)
      return []
    if (!data?.success)
      return []
    return (data.nodes || []).map((node: PluginNodeRaw) => ({ id: node.nodeId, name: node.nodeName, description: node.description }))
  })

  const handleFixSliceLayer = useMemoizedFn((nodeList: OperationNodeItem[]) => {
    const nodeIdList = nodeList.map(it => it.id)
    sendUIMsgToPlugin({ type: UIMessage.FIX_COMBINE_SLICE_NODES, data: { targetNodeId: targetRootNodeId, nodeIdList } })
  })

  return (
    <OperationBannerItem
      uiMsgProcessor={onGetSliceLayerListener}
      uiMsgSender={onGetSliceLayerSender}
      onFixHandler={handleFixSliceLayer}
      title="切图图层处理"
      subtitle="隐藏非切图层的同级节点"
      itemIdx={itemIdx}
    />
  )
}
