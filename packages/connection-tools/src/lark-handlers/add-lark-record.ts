import type { AddLarkRecordRequest, AddLarkRecordResponse, ExpectionScoreReportRequest, ExpectionScoreReportResponse } from '../types'
import { request } from '../utils'

/**
 * 在多维表格中新增一条记录
 * @param params 新增记录请求参数
 * @returns 新增记录响应数据
 */
export async function addLarkRecord(params: AddLarkRecordRequest): Promise<AddLarkRecordResponse> {
  return request
    .post('lark/multi-table/records/create', {
      json: params,
    })
    .json<AddLarkRecordResponse>()
}

export async function getLarkRecordList() {
  return request.post('lark/multi-table/records/query', { json: {} }).json()
}

/** 异常上报 */
export async function expectionReport(params: ExpectionScoreReportRequest): Promise<ExpectionScoreReportResponse> {
  return request.post('lark/multi-table/records/expectionReport', { json: params }).json()
}
