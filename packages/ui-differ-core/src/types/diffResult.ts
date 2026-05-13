import type { NodeInfo } from './node'
import { AlignmentPosition, SiblingPosition } from './enums'

export interface DomMarginInfo {
  marginTop: number
  marginBottom: number
}

export interface MarginInfo {
  left: number
  right: number
  top: number
  bottom: number
}

/** 距离比对结果 */
export interface DistanceResult {
  // diff宽高的结果
  width: number
  height: number
  // diff结果
  marginRight: number
  marginBottom: number
  marginLeft: number
  marginTop: number
}

/** 比对结果 */
export interface DiffResultInfo {
  distanceResult: DistanceResult
  designNode: NodeInfo
  originNode: NodeInfo
}

type MarginResult = Omit<DistanceResult, 'width' | 'height'>

interface MarginInfoKey {
  position: SiblingPosition
  marginKey: (keyof MarginResult)
}

export const convertElementAlignmentMarginInfo: Record<AlignmentPosition, MarginInfoKey[]> = {
  [AlignmentPosition.LEFT_TOP]: [
    { position: SiblingPosition.LEFT, marginKey: 'marginLeft' },
    { position: SiblingPosition.TOP, marginKey: 'marginTop' },
  ],
  [AlignmentPosition.LEFT_MIDDLE]: [
    { position: SiblingPosition.LEFT, marginKey: 'marginLeft' },
  ],
  [AlignmentPosition.LEFT_BOTTOM]: [
    { position: SiblingPosition.LEFT, marginKey: 'marginLeft' },
    { position: SiblingPosition.BOTTOM, marginKey: 'marginBottom' },
  ],
  [AlignmentPosition.CENTER_TOP]: [
    { position: SiblingPosition.TOP, marginKey: 'marginTop' },
  ],
  [AlignmentPosition.CENTER_MIDDLE]: [],
  [AlignmentPosition.CENTER_BOTTOM]: [
    { position: SiblingPosition.BOTTOM, marginKey: 'marginBottom' },
  ],
  [AlignmentPosition.RIGHT_TOP]: [
    { position: SiblingPosition.RIGHT, marginKey: 'marginRight' },
    { position: SiblingPosition.TOP, marginKey: 'marginTop' },
  ],
  [AlignmentPosition.RIGHT_MIDDLE]: [
    { position: SiblingPosition.RIGHT, marginKey: 'marginRight' },
  ],
  [AlignmentPosition.RIGHT_BOTTOM]: [
    { position: SiblingPosition.RIGHT, marginKey: 'marginRight' },
    { position: SiblingPosition.BOTTOM, marginKey: 'marginBottom' },
  ],
}
