import type { ExpectionScoreReportRequest } from '@ui-differ/connection-tools'

export enum ChromeMessageType {
  /**
   * 启用设备模拟
   */
  CHANGE_WINDOW_SIZE = 'CHANGE_WINDOW_SIZE',
  /**
   * 重置设备模拟，恢复正常模式
   */
  RESET_DEVICE_EMULATION = 'RESET_DEVICE_EMULATION',

  /** Content Script 请求获取选中的元素 */
  GET_SELECTED_ELEMENT = 'GET_SELECTED_ELEMENT',
  /** Background 返回选中元素的 selector 给 Content Script */
  SELECTED_ELEMENT_RESPONSE = 'SELECTED_ELEMENT_RESPONSE',

  /** Background 请求 DevTools 获取元素 selector */
  GET_ELEMENT_SELECTOR = 'GET_ELEMENT_SELECTOR',
  /** DevTools 返回 selector 给 Background */
  RETURN_ELEMENT_SELECTOR = 'RETURN_ELEMENT_SELECTOR',

  /** 心跳检测 */
  HEARTBEAT = 'HEARTBEAT',

  /** DevTools 状态更新 */
  DEVTOOLS_STATUS_UPDATE = 'DEVTOOLS_STATUS_UPDATE',
  /** 请求获取 DevTools 状态 */
  GET_DEVTOOLS_STATUS = 'GET_DEVTOOLS_STATUS',

  /** PORT 注册 */
  PORT_REGISTER = 'PORT_REGISTER',

  /** 设置页面内脚本可见 */
  SET_CONTENT_SCRIPT_VISIBLE = 'SET_CONTENT_SCRIPT_VISIBLE',

  /** 获取插件可见状态 */
  GET_PLUGIN_VISIBLE_STATUS = 'GET_PLUGIN_VISIBLE_STATUS',
}

export const DEFAULT_ROOT_NODE_ID = 'app'
export const DEFAULT_ROOT_NODE_ID_SECOND = 'root'

export enum DevToolsNameEnum {
  UI_DIFF_PANEL = 'ui-diff-panel',
}

/** 比对结果类型 */
export enum DiffResultTypeEnum {
  /** 设计稿节点数异常 */
  ABNORMAL_DESIGN_COUNT = 'ABNORMAL_DESIGN_COUNT',
  /** 匹配率较低但通过 */
  LOW_MATCH_RATE_BUT_PASS = 'LOW_MATCH_RATE_BUT_PASS',
  /** 匹配率较低且不通过 */
  LOW_MATCH_RATE_AND_FAIL = 'LOW_MATCH_RATE_AND_FAIL',
  /** 匹配率异常 */
  MATCH_RATE_ABNORMAL = 'MATCH_RATE_ABNORMAL',
  /** 走查通过 */
  PASS = 'PASS',
  /** 走查不通过 */
  FAIL = 'FAIL',
}

/** 比对结果类型 */
export const diffResultTypeEnumRecord: Record<DiffResultTypeEnum, string> = {
  [DiffResultTypeEnum.ABNORMAL_DESIGN_COUNT]: '设计稿节点数异常',
  [DiffResultTypeEnum.LOW_MATCH_RATE_BUT_PASS]: '匹配率较低但通过',
  [DiffResultTypeEnum.LOW_MATCH_RATE_AND_FAIL]: '匹配率较低且不通过',
  [DiffResultTypeEnum.MATCH_RATE_ABNORMAL]: '匹配率异常',
  [DiffResultTypeEnum.PASS]: '走查通过',
  [DiffResultTypeEnum.FAIL]: '走查不通过',
}

/** 比对结果分析返回值 */
export type DiffResultTipsInfo = ExpectionScoreReportRequest & {
  type: DiffResultTypeEnum
  score: number
  matchRate: number
  designNodeCount: number
  htmlNodeCount: number
}

/** 需要自动上报的比对结果类型 */
export const autoReportDiffResultTypeSet = new Set<DiffResultTypeEnum>([
  DiffResultTypeEnum.LOW_MATCH_RATE_BUT_PASS,
  DiffResultTypeEnum.LOW_MATCH_RATE_AND_FAIL,
  DiffResultTypeEnum.MATCH_RATE_ABNORMAL,
])
