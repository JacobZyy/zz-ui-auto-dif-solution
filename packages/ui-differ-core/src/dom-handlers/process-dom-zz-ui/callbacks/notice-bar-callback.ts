import type { Draft } from 'immer'
import type { NodeInfo } from '../../../types'

export function zzNoticeBarCallback(nodeInfo: Draft<NodeInfo>) {
  nodeInfo.shouldSkipShrinkBounding = true
}
