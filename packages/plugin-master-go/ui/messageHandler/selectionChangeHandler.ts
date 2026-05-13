import type { NodeInfo } from '@ui-differ/core'

type FlatNodeMap = Map<string, NodeInfo>
interface RootOffset {
  x: number
  y: number
  height: number
  id: string
}

interface SelectionDataType {
  flatNodeMap: FlatNodeMap
  rootOffset: RootOffset
}

type SelectionMessageData = Record<'nodeMapInfoForDiff' | 'nodeMapInfoForTest', SelectionDataType>

export async function selectionChangeHandler(messageData: SelectionMessageData) {
  return messageData
}
