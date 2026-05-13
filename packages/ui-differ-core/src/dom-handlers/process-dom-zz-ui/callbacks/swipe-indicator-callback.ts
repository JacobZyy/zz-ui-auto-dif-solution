import type { Draft } from 'immer'
import type { NodeInfo } from '../../../types'

export function swipeIndicatorCallback(nodeInfo: Draft<NodeInfo>) {
  nodeInfo.isEmptyNode = false
}
