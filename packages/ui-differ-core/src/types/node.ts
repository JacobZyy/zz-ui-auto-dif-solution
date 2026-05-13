import type { ElementSizeConstraintResult } from '../utils'
import type { DistanceResult } from './diffResult'
import type { AlignmentPosition } from './enums'
import { SiblingPosition } from './enums'

export type UniqueId = string

/**
 * 文本对齐方向类型
 */
export type TextAlignment = 'left' | 'center' | 'right'

export const TextAlignmentDesignConvertMap: Record<TextNode['textAlignHorizontal'], TextAlignment> = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFIED: 'left',
}

export interface TextStyleInfo {
  /** 行高 */
  lineHeight: number
  /** 文本宽度 */
  textWidth: number
  /** 字体大小 */
  fontSize: number
  // /** 字体粗细 */
  // fontWeight: number
  // /** 字体 */
  // fontFamily: string
  /** 文本行数 */
  textLineCount: number
  /** 文本对齐方向 */
  textAlignment: TextAlignment
  textContent: string
  textAutoResize?: TextNode['textAutoResize']
}

export interface NodeFlexInfo {
  isFlex: boolean
  flexDirection: string
  flexWrap: string
  justifyContent: string
  alignItems: string
  flexShrink: string
  flexGrow: string
  flexBasis: string
}

export type BorderKey = 'borderLeft' | 'borderRight' | 'borderTop' | 'borderBottom'

export interface BorderBaseInfo {
  width: number
  color: string
  from: 'before' | 'after' | 'normal'
}

export type BorderInfo = Record<BorderKey, BorderBaseInfo>

export interface PaddingInfo {
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
}

/**
 * 节点边界
 */
export interface BoundingRect {
  /** 左上角 x 坐标 */
  x: number
  y: number
  width: number
  height: number
}

/** 只记录2 4 6 8 四个方向的兄弟节点信息 */
type SiblingRelativeNodeInfo = Partial<Record<SiblingPosition, UniqueId>>

/** 单节点匹配结果 */
export interface MatchResult {
  designNodeId: UniqueId
  confidence: number
  centerDistance: number
  overlapRatio: number
}

export interface NeighborMarginInfo {
  isParent: boolean
  value: number
  isDirectlySibling: boolean
}

/**
 * 节点信息
 */
export interface NodeInfo extends SiblingRelativeNodeInfo {
  /** 父节点 id */
  parentId: UniqueId
  /** 子节点 id */
  children: UniqueId[]
  /** 兄弟节点 id */
  sibling: UniqueId[]
  uniqueId: UniqueId
  nodeName: string
  /** 节点边界 */
  boundingRect: BoundingRect
  /** padding信息 */
  paddingInfo: PaddingInfo
  /** border信息 */
  borderInfo: BorderInfo
  /** 背景色 */
  backgroundColor: string
  /** 标签名称（设计稿则为节点类型） */
  tagName?: string | SceneNode['type']
  /** 文本样式信息, 只有内部是文本的节点才有这个字段 */
  textStyleInfo?: TextStyleInfo
  /** 节点的中心信息 @description DOM ONLY */
  nodeFlexInfo?: NodeFlexInfo
  /** 相邻节点的边距 */
  neighborMarginInfo: Partial<Record<SiblingPosition, NeighborMarginInfo>>
  /**
   * 是否是bfc元素
   * @default false
   */
  isBFC?: boolean
  /** 第一次找邻居节点的信息，用于后续的使用 */
  initialNeighborInfos?: SiblingRelativeNodeInfo
  /** 是否脱离了文档流 */
  isOutOfDocumentFlow?: boolean
  isChildOfOutOfDocumentFlow?: boolean
  /** 是否是空节点 */
  isEmptyNode?: boolean
  /** 是否是纯背景色节点 */
  isBackgroundColorNode?: boolean
  /** 匹配的设计稿节点id */
  matchedDesignNodeId?: UniqueId
  /** 是否是行内元素 */
  isInlineNode?: boolean
  /** 是否是添加的文本wrapper */
  isTextWrapper?: boolean
  matchResult?: MatchResult
  originBounding: BoundingRect
  /** 是否需要shrinkBounding */
  shouldSkipShrinkBounding?: boolean
  isOutOfViewport?: boolean
  /** 列表项标识符 */
  listElementTag?: string
  isZZUI?: boolean
  alignment?: AlignmentPosition
  elementSizeConstraintResult?: ElementSizeConstraintResult
}

/** 有效的兄弟节点位置 */
export const validateSiblingPosList = [SiblingPosition.TOP, SiblingPosition.BOTTOM, SiblingPosition.LEFT, SiblingPosition.RIGHT]

/** 无效的兄弟节点位置合集 */
export const invalidSiblingPositionSet = new Set([
  SiblingPosition.NONE,
  SiblingPosition.TOP_LEFT,
  SiblingPosition.TOP_RIGHT,
  SiblingPosition.BOTTOM_LEFT,
  SiblingPosition.BOTTOM_RIGHT,
])

/** 当前节点与兄弟节点之间的位置映射 */
export const currentNodeToSiblingPositionMap: Record<SiblingPosition, SiblingPosition> = {
  [SiblingPosition.TOP]: SiblingPosition.BOTTOM,
  [SiblingPosition.BOTTOM]: SiblingPosition.TOP,
  [SiblingPosition.LEFT]: SiblingPosition.RIGHT,
  [SiblingPosition.RIGHT]: SiblingPosition.LEFT,
  [SiblingPosition.TOP_LEFT]: SiblingPosition.BOTTOM_RIGHT,
  [SiblingPosition.TOP_RIGHT]: SiblingPosition.BOTTOM_LEFT,
  [SiblingPosition.BOTTOM_LEFT]: SiblingPosition.TOP_RIGHT,
  [SiblingPosition.BOTTOM_RIGHT]: SiblingPosition.TOP_LEFT,
  [SiblingPosition.NONE]: SiblingPosition.NONE,
}

export const siblingPositionToDiffResultKey: Record<SiblingPosition, keyof DistanceResult> = {
  [SiblingPosition.TOP]: 'marginTop',
  [SiblingPosition.BOTTOM]: 'marginBottom',
  [SiblingPosition.LEFT]: 'marginLeft',
  [SiblingPosition.RIGHT]: 'marginRight',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.TOP_LEFT]: 'marginTop',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.TOP_RIGHT]: 'marginTop',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.BOTTOM_LEFT]: 'marginBottom',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.BOTTOM_RIGHT]: 'marginBottom',
  /** @deprecated 无效的兄弟节点位置 */
  [SiblingPosition.NONE]: 'marginTop',
}

export const convertPositionToBoundingKeys: Record<SiblingPosition, (keyof BoundingRect)[]> = {
  [SiblingPosition.TOP]: ['y'],
  [SiblingPosition.BOTTOM]: ['y', 'height'],
  [SiblingPosition.LEFT]: ['x'],
  [SiblingPosition.RIGHT]: ['x', 'width'],
  [SiblingPosition.TOP_LEFT]: [],
  [SiblingPosition.TOP_RIGHT]: [],
  [SiblingPosition.BOTTOM_LEFT]: [],
  [SiblingPosition.BOTTOM_RIGHT]: [],
  [SiblingPosition.NONE]: [],
}

export const convertDirectionKeyToBoudingKeys: Record<'left' | 'right' | 'top' | 'bottom', (keyof BoundingRect)[]> = {
  left: ['x'],
  right: ['x', 'width'],
  top: ['y'],
  bottom: ['y', 'height'],
}

export const shouldSkipShrinkBoundingTagNameSet = new Set([
  'CANVAS',
  'SVG',
  'I',
])
