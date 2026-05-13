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

interface UnifiedLineHeightProps {
  itemIdx: number
}

export function UnifiedLineHeight({ itemIdx }: UnifiedLineHeightProps) {
  const targetRootNodeId = useDetectPageStore(state => state.targetRootNodeId)

  const onGetLineHeightSender = useMemoizedFn(() => {
    sendUIMsgToPlugin({ type: UIMessage.GET_UNIFIED_LINE_HEIGHT_NODES, data: { targetNodeId: targetRootNodeId } })
  })

  const onGetLineHeightListener = useMemoizedFn(async (event: MessageEvent<PluginMessageType>) => {
    const { type, data } = event.data
    if (type !== PluginMessage.UNIFIED_LINE_HEIGHT_NODES)
      return []
    if (!data?.success)
      return []
    return (data.nodes || []).map((node: PluginNodeRaw) => ({ id: node.nodeId, name: node.nodeName, description: node.description }))
  })

  const handleFixLineHeight = useMemoizedFn((nodeList: OperationNodeItem[]) => {
    const nodeIdList = nodeList.map(it => it.id)
    sendUIMsgToPlugin({ type: UIMessage.FIX_UNIFIED_LINE_HEIGHT_NODES, data: { targetNodeId: targetRootNodeId, nodeIdList } })
  })

  return (
    <OperationBannerItem
      uiMsgProcessor={onGetLineHeightListener}
      uiMsgSender={onGetLineHeightSender}
      onFixHandler={handleFixLineHeight}
      title="统一行高"
      subtitle="单行文本行高压到字号"
      itemIdx={itemIdx}
    />
  )
}
