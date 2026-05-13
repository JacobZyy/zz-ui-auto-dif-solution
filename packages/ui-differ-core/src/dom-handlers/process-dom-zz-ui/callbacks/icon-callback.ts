import type { Draft } from 'immer'
import type { NodeInfo } from '../../../types'

export function zzIconCallback(nodeInfo: Draft<NodeInfo>) {
  nodeInfo.isEmptyNode = false
}
