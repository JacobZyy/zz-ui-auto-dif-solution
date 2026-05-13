import type { UIDiffScoreInfo } from '@ui-differ/connection-tools'
import type { DiffResultInfo, NodeInfo } from '@ui-differ/core'
import chalk from '@alita/chalk'
import { getMappedListDiffResult } from './getMappedListDiffResult'

interface Options {
  flatNodeMap: Map<string, NodeInfo>
  designNodeInfo: Map<string, NodeInfo>
  diffResult: DiffResultInfo[]
  filteredCorrectDiffResult: DiffResultInfo[]
}

export function calculateDiffResultRate({ flatNodeMap, designNodeInfo, diffResult, filteredCorrectDiffResult }: Options): UIDiffScoreInfo {
  const mappedListDiffResult = getMappedListDiffResult(filteredCorrectDiffResult)
  /** 设计稿节点数与前端节点数的最小值 */
  const minNodeSize = Math.min(flatNodeMap.size, designNodeInfo.size)
  /** 去重前的节点数量 */
  const abnormalNodeCount = filteredCorrectDiffResult.length
  const emptyListCount = mappedListDiffResult.get('empty')?.length || 0
  /** 去除重复列表节点后，前端节点数量 */
  const distinctAbnormalCount = Math.max(mappedListDiffResult.size - 1, 0) + emptyListCount

  /** 匹配率  */
  const matchRate = Math.round(diffResult.length / minNodeSize * 10000) / 10000

  /** 异常率 */
  const abnormalRate = Math.round(distinctAbnormalCount / minNodeSize * 10000) / 10000

  chalk.info(`前端共${flatNodeMap.size}个节点，设计稿共${designNodeInfo.size}个节点，与设计稿匹配到${diffResult.length}个节点，异常节点${distinctAbnormalCount}`)
  chalk.info(`节点匹配率${matchRate * 100}%`)
  chalk.info(`异常节点率${abnormalRate * 100}%`)

  return {
    matchRate,
    matchNodeCount: diffResult.length,
    abnormalRate,
    htmlNodeCount: flatNodeMap.size,
    designNodeCount: designNodeInfo.size,
    abnormalNodeCount,
    distinctAbnormalCount,
  }
}
