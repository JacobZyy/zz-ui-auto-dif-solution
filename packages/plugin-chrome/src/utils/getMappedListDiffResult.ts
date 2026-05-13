import type { DiffResultInfo } from '@ui-differ/core'

/**
 * 将差异结果按照listElementTag进行分类
 * @param diffResult
 * @returns
 */
export function getMappedListDiffResult(diffResult: DiffResultInfo[]) {
  const listDiffResultMap = new Map<string, DiffResultInfo[]>()
  diffResult.forEach((resultItem) => {
    const { originNode } = resultItem
    const { listElementTag } = originNode

    const mapKey = listElementTag || 'empty'
    const prevListDiffResultCount = listDiffResultMap.get(mapKey) ?? []
    listDiffResultMap.set(mapKey, [...prevListDiffResultCount, resultItem])
  })
  return listDiffResultMap
}
