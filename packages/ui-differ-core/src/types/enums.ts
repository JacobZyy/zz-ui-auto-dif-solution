/**
 * 相对于当前节点的兄弟节点位置枚举
 */
export enum SiblingPosition {
  /** 不在任何位置 */
  NONE = 0,
  /** 左上角 */
  TOP_LEFT = 1,
  /** 正上方 */
  TOP = 2,
  /** 右上角 */
  TOP_RIGHT = 3,
  /** 左侧 */
  LEFT = 4,
  /** 右侧 */
  RIGHT = 6,
  /** 左下角 */
  BOTTOM_LEFT = 7,
  /** 正下方 */
  BOTTOM = 8,
  /** 右下角 */
  BOTTOM_RIGHT = 9,
}

export enum NodeFlexType {
  NOT_FLEX = -1,
  NOT_FLEX_1 = 0,
  FLEX_COLUMN_1 = 1,
  FLEX_ROW_1 = 2,
}

/** ios部分头的高度 */
export const PHONE_HEADER_HEIGHT = 88
/** ios底部安全距离的高度 */
export const SAFE_BOTTOM_HEIGHT = 68

export const ignoreChildrenClsSet = new Set(['z-upload-btn'])

export const DEFAULT_PAGE_WIDTH = 375
export const DEFAULT_PAGE_HEIGHT = 734

/** 安全高度类型 */
export enum SafeTopAreaType {
  /** 状态栏 */
  STATUS_BANNER = 'STATUS_BANNER',
  /** 状态栏和导航栏 */
  STATUS_AND_NAVIGATION = 'STATUS_AND_NAVIGATION',
  /** 不排除 */
  NONE = 'NONE',
  /** 部分区域diff */
  PART_DIFF = 'PART_DIFF',
}

/** 安全高度类型 */
export const safeTopAreaTypeOptions: Array<{ label: string, value: SafeTopAreaType }> = [
  { label: '排除状态栏高度', value: SafeTopAreaType.STATUS_BANNER },
  { label: '排除状态栏和导航栏高度', value: SafeTopAreaType.STATUS_AND_NAVIGATION },
  { label: '不排除', value: SafeTopAreaType.NONE },
  { label: '部分区域diff', value: SafeTopAreaType.PART_DIFF },
]

/** 安全高度类型 */
export const safeTopAreaTypeMap: Map<SafeTopAreaType, { safeTopHeight: number, safeBottomHeight: number }> = new Map([
  [SafeTopAreaType.STATUS_BANNER, { safeTopHeight: PHONE_HEADER_HEIGHT, safeBottomHeight: SAFE_BOTTOM_HEIGHT }],
  [SafeTopAreaType.STATUS_AND_NAVIGATION, { safeTopHeight: PHONE_HEADER_HEIGHT * 2, safeBottomHeight: SAFE_BOTTOM_HEIGHT }],
  [SafeTopAreaType.NONE, { safeTopHeight: 0, safeBottomHeight: SAFE_BOTTOM_HEIGHT }],
  [SafeTopAreaType.PART_DIFF, { safeTopHeight: 0, safeBottomHeight: 0 }],
])

/**
 * diff边距方向列表
 */
export const diffMarginDirectionList = [SiblingPosition.LEFT, SiblingPosition.TOP, SiblingPosition.RIGHT, SiblingPosition.BOTTOM] as const

export const domClearZZUIWhiteNameList = ['z-icon', 'z-divider']
/**
 * 节点在父容器中的对齐位置枚举
 */
export enum AlignmentPosition {
  /** 左上 */
  LEFT_TOP = 'LEFT_TOP',
  /** 左中 */
  LEFT_MIDDLE = 'LEFT_MIDDLE',
  /** 左下 */
  LEFT_BOTTOM = 'LEFT_BOTTOM',
  /** 中上 */
  CENTER_TOP = 'CENTER_TOP',
  /** 中中 */
  CENTER_MIDDLE = 'CENTER_MIDDLE',
  /** 中下 */
  CENTER_BOTTOM = 'CENTER_BOTTOM',
  /** 右上 */
  RIGHT_TOP = 'RIGHT_TOP',
  /** 右中 */
  RIGHT_MIDDLE = 'RIGHT_MIDDLE',
  /** 右下 */
  RIGHT_BOTTOM = 'RIGHT_BOTTOM',
}
