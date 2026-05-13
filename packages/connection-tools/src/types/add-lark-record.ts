/** 飞书多维表格字段值类型 */
export type LarkFieldValue = string | number | boolean | null | Record<string, unknown>

export interface UIDiffScoreInfo {
  /** 前端节点数 */
  htmlNodeCount: number
  /** 设计稿节点数 */
  designNodeCount: number
  /** 匹配节点数 */
  matchNodeCount: number
  /** 异常节点数 */
  abnormalNodeCount: number
  /** 去重后的异常节点数 */
  distinctAbnormalCount: number
  /** 节点匹配率 */
  matchRate: number
  /** 异常节点率 */
  abnormalRate: number
}

export interface UIDiffBaseInfo {
  /** 设计文档id */
  documentId: string
  /** 设计文档名 */
  documentName: string
  /** 设计稿页面名称 */
  pageName: string
  /** 设计稿页面ID */
  pageId: string
  /** 设计稿ID */
  designId: string
  /** 设计稿名字 */
  designName: string
  /** 区域ID */
  designAreaId: string
  /** 区域名称 */
  designAreaName: string
  /** 页面URL */
  pageUrl: string
  /** 页面截图 */
  pageScreenShot: string
}

export type UIDiffFieldType = UIDiffScoreInfo & Partial<UIDiffBaseInfo>

/** 新增记录请求参数 */
export interface AddLarkRecordRequest {
  /** 记录字段数据 */
  fields: UIDiffFieldType
}

/** 飞书记录信息 */
export interface LarkRecord {
  /** 记录ID */
  record_id?: string
  /** 记录字段数据 */
  fields: Record<string, LarkFieldValue>
}

/** 新增记录响应数据 */
export interface AddLarkRecordResponse {
  /** 响应状态码 */
  code: number
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data: {
    /** 记录信息 */
    record: LarkRecord
  }
}

/** 异常上报请求 */
export interface ExpectionScoreReportRequest {
  /** 数据源的记录Id */
  combinedRecord?: string[]
  /** 页面Url */
  pageUrl?: string
  /** 异常类型 */
  expectionType: string
  /** ppu */
  loginPPU?: string
  /** 当前记录Id */
  currentRecordId?: string
  /** 设计稿url */
  designUrl?: string
  /** 测试代理 */
  proxyInfo?: string
}

/** 异常上报响应 */
export interface ExpectionScoreReportResponse {
  /** 错误码，0 表示成功 */
  code: number
  /** 错误信息 */
  msg: string
  /** 数据 */
  data: {
    /** 新增的记录 */
    recordId: string
  }
}
