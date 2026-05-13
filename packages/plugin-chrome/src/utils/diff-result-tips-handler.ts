import type { ExpectionScoreReportRequest, UIDiffFieldType } from '@ui-differ/connection-tools'
import type { DiffResultTipsInfo } from '@/types'
import { expectionReport } from '@ui-differ/connection-tools'
import { getCookie } from 'cookies-next'
import { useDiffResultTipInfo } from '@/stores'
import { autoReportDiffResultTypeSet, DiffResultTypeEnum, diffResultTypeEnumRecord } from '@/types'

interface Options {
  diffResultInfo: UIDiffFieldType
  recordId: string
}

/** 获取比对结果类型 */
function getDiffResultTipsType(options: Options): DiffResultTypeEnum {
  const { diffResultInfo } = options
  const { matchNodeCount, designNodeCount, htmlNodeCount, abnormalRate } = diffResultInfo
  /** 基础节点数 */
  const baseNodeCount = Math.min(htmlNodeCount, designNodeCount)
  /** 匹配率 */
  const matchRate = Math.floor(matchNodeCount / baseNodeCount * 100) / 100
  /** 最终还原度得分 */
  const finalScore = Math.floor((1 - abnormalRate) * 100)
  /** 是否是设计稿节点数 --> 设计稿节点数量很少但是前端节点很多 */
  const isAbnormalDesignCount = designNodeCount < 10 && htmlNodeCount - designNodeCount > 50
  /** 是否匹配率较低：基准节点大于50，且匹配率小于0.3 --> 可能匹配算法有缺陷，可以考虑切换到区域比对模式 */
  const isMatchRateTooLow = baseNodeCount > 50 && matchRate - 0.3 < 1e-5

  if (isAbnormalDesignCount) {
    return DiffResultTypeEnum.ABNORMAL_DESIGN_COUNT
  }

  if (isMatchRateTooLow) {
    return finalScore > 80 ? DiffResultTypeEnum.LOW_MATCH_RATE_BUT_PASS : DiffResultTypeEnum.LOW_MATCH_RATE_AND_FAIL
  }

  // 异常匹配率 --> 匹配率小于0.2
  if (matchRate - 0.2 < 1e-5) {
    return DiffResultTypeEnum.MATCH_RATE_ABNORMAL
  }

  if (finalScore > 80) {
    return DiffResultTypeEnum.PASS
  }
  return DiffResultTypeEnum.FAIL
}

/**
 * 处理比对结果提示
 * @param options 比对结果和记录ID
 * @returns
 */
export async function diffResultTipsHandler(options: Options) {
  const { diffResultInfo, recordId } = options
  const { matchNodeCount, designNodeCount, htmlNodeCount, abnormalRate } = diffResultInfo
  const baseNodeCount = Math.min(htmlNodeCount, designNodeCount)

  const matchRate = Math.floor(matchNodeCount / baseNodeCount * 100) / 100

  const finalScore = Math.floor((1 - abnormalRate) * 100)

  const diffResultTipInfoType = getDiffResultTipsType(options)

  /** 当前登录信息（用于异常调试时登录账号） */
  const ppu = await getCookie('ppu')

  /** 异常上报参数 */
  const expectionReportParams: ExpectionScoreReportRequest = {
    combinedRecord: [recordId],
    pageUrl: location.href,
    loginPPU: ppu,
    expectionType: diffResultTypeEnumRecord[diffResultTipInfoType],
  }

  const currentDiffResultTip: DiffResultTipsInfo = {
    score: finalScore,
    matchRate,
    designNodeCount,
    htmlNodeCount,
    type: diffResultTipInfoType,
    ...expectionReportParams,
  }

  const shouldAutoReportExpection = autoReportDiffResultTypeSet.has(diffResultTipInfoType)

  // 必要时自动上报异常
  if (shouldAutoReportExpection) {
    const reportResult = await expectionReport(expectionReportParams)
    const reportRecordId = reportResult.data?.recordId
    useDiffResultTipInfo.setState(() => ({ currentRecordId: reportRecordId }))
  }

  // 更新状态
  useDiffResultTipInfo.setState(() => ({ ...currentDiffResultTip, resultModalOpen: true }))
}
