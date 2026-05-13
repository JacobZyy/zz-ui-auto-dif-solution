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

interface HoistingRectangleStyleProps {
  itemIdx: number
}

export function HoistingRectangleStyle({ itemIdx }: HoistingRectangleStyleProps) {
  const targetRootNodeId = useDetectPageStore(state => state.targetRootNodeId)

  const onGetHoistingSender = useMemoizedFn(() => {
    sendUIMsgToPlugin({ type: UIMessage.GET_HOISTING_RECTANGLE_NODES, data: { targetNodeId: targetRootNodeId } })
  })

  const onGetHoistingListener = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.HOISTING_RECTANGLE_NODES)
      return []
    if (!data?.success)
      return []
    return (data.nodes || []).map((node: PluginNodeRaw) => ({ id: node.nodeId, name: node.nodeName, description: node.description }))
  })

  const handleFixHoisting = useMemoizedFn((nodeList: OperationNodeItem[]) => {
    const nodeIdList = nodeList.map(it => it.id)
    sendUIMsgToPlugin({ type: UIMessage.FIX_HOISTING_RECTANGLE_NODES, data: { targetNodeId: targetRootNodeId, nodeIdList } })
  })

  return (
    <OperationBannerItem
      uiMsgProcessor={onGetHoistingListener}
      uiMsgSender={onGetHoistingSender}
      onFixHandler={handleFixHoisting}
      title="背景样式上提"
      subtitle="将背景矩形样式合并到父节点"
      itemIdx={itemIdx}
    />
  )
}
