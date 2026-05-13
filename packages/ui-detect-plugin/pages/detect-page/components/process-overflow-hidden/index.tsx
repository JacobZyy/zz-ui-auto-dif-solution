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

interface ProcessOverflowHiddenProps {
  itemIdx: number
}

export function ProcessOverflowHidden({ itemIdx }: ProcessOverflowHiddenProps) {
  const targetRootNodeId = useDetectPageStore(state => state.targetRootNodeId)

  const onGetOverflowSender = useMemoizedFn(() => {
    sendUIMsgToPlugin({ type: UIMessage.GET_OVERFLOW_HIDDEN_NODES, data: { targetNodeId: targetRootNodeId } })
  })

  const onGetOverflowListener = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.OVERFLOW_HIDDEN_NODES)
      return []
    if (!data?.success)
      return []
    return (data.nodes || []).map((node: PluginNodeRaw) => ({ id: node.nodeId, name: node.nodeName, description: node.description }))
  })

  const handleFixOverflow = useMemoizedFn((nodeList: OperationNodeItem[]) => {
    const nodeIdList = nodeList.map(it => it.id)
    sendUIMsgToPlugin({ type: UIMessage.FIX_OVERFLOW_HIDDEN_NODES, data: { targetNodeId: targetRootNodeId, nodeIdList } })
  })

  return (
    <OperationBannerItem
      uiMsgProcessor={onGetOverflowListener}
      uiMsgSender={onGetOverflowSender}
      onFixHandler={handleFixOverflow}
      title="溢出隐藏处理"
      subtitle="按裁剪容器约束子节点尺寸"
      itemIdx={itemIdx}
    />
  )
}
