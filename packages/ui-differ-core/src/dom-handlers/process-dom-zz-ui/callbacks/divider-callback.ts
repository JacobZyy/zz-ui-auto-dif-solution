import type { Draft } from 'immer'
import type { NodeInfo } from '../../../types'

export function zzDividerCallback(nodeInfo: Draft<NodeInfo>) {
  nodeInfo.isEmptyNode = false
}
