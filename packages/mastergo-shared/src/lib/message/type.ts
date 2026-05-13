// 插件发出的消息
export enum PluginMessage {
  /** 选中变更 */
  SELECTION_CHANGE = 'SELECTION_CHANGE',
  /** 文档信息 */
  DOCUMENT_INFO = 'DOCUMENT_INFO',
  /** 顶层设计图节点 */
  TOP_PARENT_NODE = 'TOP_PARENT_NODE',
  /** 预览图 */
  PREVIEW_IMAGE = 'PREVIEW_IMAGE',
  /** 不可见节点 */
  UN_VISIBLE_NODES = 'UN_VISIBLE_NODES',
  /** 蒙版图层合并-检测响应 */
  COMBINE_MASK_NODES = 'COMBINE_MASK_NODES',
  /** 蒙版图层合并-修复响应 */
  COMBINE_MASK_FIXED = 'COMBINE_MASK_FIXED',
  /** 切图图层处理-检测响应 */
  COMBINE_SLICE_NODES = 'COMBINE_SLICE_NODES',
  /** 切图图层处理-修复响应 */
  COMBINE_SLICE_FIXED = 'COMBINE_SLICE_FIXED',
  /** 背景样式上提-检测响应 */
  HOISTING_RECTANGLE_NODES = 'HOISTING_RECTANGLE_NODES',
  /** 背景样式上提-修复响应 */
  HOISTING_RECTANGLE_FIXED = 'HOISTING_RECTANGLE_FIXED',
  /** 统一行高-检测响应 */
  UNIFIED_LINE_HEIGHT_NODES = 'UNIFIED_LINE_HEIGHT_NODES',
  /** 统一行高-修复响应 */
  UNIFIED_LINE_HEIGHT_FIXED = 'UNIFIED_LINE_HEIGHT_FIXED',
  /** 溢出隐藏处理-检测响应 */
  OVERFLOW_HIDDEN_NODES = 'OVERFLOW_HIDDEN_NODES',
  /** 溢出隐藏处理-修复响应 */
  OVERFLOW_HIDDEN_FIXED = 'OVERFLOW_HIDDEN_FIXED',
  /** 设计稿备份完成响应 */
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
  /** 当前选择信息（用于进入检测页时获取） */
  CURRENT_SELECTION = 'CURRENT_SELECTION',
  /** MCP 选中快照（供 mcp-bridge 推送到 MCP server） */
  SELECTION_FOR_MCP = 'SELECTION_FOR_MCP',
  /** 按需查询的节点信息响应 */
  NODE_INFO = 'NODE_INFO',
}

// UI发出的消息
export enum UIMessage {
  /** 获取选中内容 */
  GET_SELECTION = 'GET_SELECTION',
  /** 绘制节点的边框 */
  DRAW_NODE_OVERLAYS = 'DRAW_NODE_OVERLAYS',
  /** 获取文档内容 */
  GET_DOCUMENT_INFO = 'GET_DOCUMENT_INFO',
  /** 获取顶层设计图节点 */
  GET_TOP_PARENT_NODE = 'GET_TOP_PARENT_NODE',
  /** 获取预览图 */
  GET_PREVIEW_IMAGE = 'GET_PREVIEW_IMAGE',
  /** 获取不可见节点信息 */
  GET_UN_VISIBLE_NODES = 'GET_UN_VISIBLE_NODES',
  /** 定位节点 */
  LOCATE_NODE = 'LOCATE_NODE',
  /** 清除不可见节点 */
  CLEAR_UN_VISIBLE_NODES = 'CLEAR_UN_VISIBLE_NODES',
  // === 预处理步骤专用消息 ===
  /** 蒙版图层合并-检测请求 */
  GET_COMBINE_MASK_NODES = 'GET_COMBINE_MASK_NODES',
  /** 蒙版图层合并-修复请求 */
  FIX_COMBINE_MASK_NODES = 'FIX_COMBINE_MASK_NODES',
  /** 切图图层处理-检测请求 */
  GET_COMBINE_SLICE_NODES = 'GET_COMBINE_SLICE_NODES',
  /** 切图图层处理-修复请求 */
  FIX_COMBINE_SLICE_NODES = 'FIX_COMBINE_SLICE_NODES',
  /** 背景样式上提-检测请求 */
  GET_HOISTING_RECTANGLE_NODES = 'GET_HOISTING_RECTANGLE_NODES',
  /** 背景样式上提-修复请求 */
  FIX_HOISTING_RECTANGLE_NODES = 'FIX_HOISTING_RECTANGLE_NODES',
  /** 统一行高-检测请求 */
  GET_UNIFIED_LINE_HEIGHT_NODES = 'GET_UNIFIED_LINE_HEIGHT_NODES',
  /** 统一行高-修复请求 */
  FIX_UNIFIED_LINE_HEIGHT_NODES = 'FIX_UNIFIED_LINE_HEIGHT_NODES',
  /** 溢出隐藏处理-检测请求 */
  GET_OVERFLOW_HIDDEN_NODES = 'GET_OVERFLOW_HIDDEN_NODES',
  /** 溢出隐藏处理-修复请求 */
  FIX_OVERFLOW_HIDDEN_NODES = 'FIX_OVERFLOW_HIDDEN_NODES',
  /** 设计稿备份请求 */
  BACKUP_DESIGN_NODES = 'BACKUP_DESIGN_NODES',
  /** 获取当前选择信息（用于进入检测页） */
  GET_CURRENT_SELECTION = 'GET_CURRENT_SELECTION',
  /** 向 sandbox 请求查询特定节点 */
  GET_NODE_INFO = 'GET_NODE_INFO',
}

/**
 * 预处理问题类型枚举
 * 字符串值与 core 层的 RuleType 对齐，改动时需同步
 */
export enum PreprocessType {
  COMBINE_MASK = 'COMBINE_MASK',
  COMBINE_SLICE = 'COMBINE_SLICE',
  HOISTING_RECTANGLE = 'HOISTING_RECTANGLE',
  UNIFIED_LINE_HEIGHT = 'UNIFIED_LINE_HEIGHT',
  OVERFLOW_HIDDEN = 'OVERFLOW_HIDDEN',
}

/** 预处理问题节点信息 */
export interface PreprocessNodeInfo {
  type: PreprocessType
  nodeId: string
  nodeName: string
  description: string
}
