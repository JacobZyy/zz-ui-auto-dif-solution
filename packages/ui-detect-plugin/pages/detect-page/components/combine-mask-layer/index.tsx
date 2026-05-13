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

interface CombineMaskLayerProps {
  itemIdx: number
}

export function CombineMaskLayer({ itemIdx }: CombineMaskLayerProps) {
  const targetRootNodeId = useDetectPageStore(state => state.targetRootNodeId)

  const onGetMaskLayerSender = useMemoizedFn(() => {
    sendUIMsgToPlugin({ type: UIMessage.GET_COMBINE_MASK_NODES, data: { targetNodeId: targetRootNodeId } })
  })

  const onGetMaskLayerListener = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.COMBINE_MASK_NODES)
      return []
    if (!data?.success)
      return []
    return (data.nodes || []).map((node: PluginNodeRaw) => ({ id: node.nodeId, name: node.nodeName, description: node.description }))
  })

  const handleFixMaskLayer = useMemoizedFn((nodeList: OperationNodeItem[]) => {
    const nodeIdList = nodeList.map(it => it.id)
    sendUIMsgToPlugin({ type: UIMessage.FIX_COMBINE_MASK_NODES, data: { targetNodeId: targetRootNodeId, nodeIdList } })
  })

  return (
    <OperationBannerItem
      uiMsgProcessor={onGetMaskLayerListener}
      uiMsgSender={onGetMaskLayerSender}
      onFixHandler={handleFixMaskLayer}
      title="蒙版图层合并"
      subtitle="将蒙版节点重新分组抹平"
      itemIdx={itemIdx}
    />
  )
}
