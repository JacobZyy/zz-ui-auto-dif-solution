import type { Draft } from 'immer'
import type { NodeInfo } from '../../../types'

export function zzFixedTopContainerCallback(nodeInfo: Draft<NodeInfo>) {
  console.log('🚀 ~ zzFixedTopContainerCallback ~ nodeInfo:', nodeInfo)
}
