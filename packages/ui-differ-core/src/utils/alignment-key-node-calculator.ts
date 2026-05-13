import type { BoundingRect } from '../types'
import { AlignmentPosition } from '../types'

function leftTopNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x,
    y: boundingRect.y,
  }
}

function leftBottomNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x,
    y: boundingRect.y + boundingRect.height,
  }
}

function leftMiddleNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x,
    y: boundingRect.y + boundingRect.height / 2,
  }
}

function rightTopNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x + boundingRect.width,
    y: boundingRect.y,
  }
}

function rightBottomNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x + boundingRect.width,
    y: boundingRect.y + boundingRect.height,
  }
}

function rightMiddleNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x + boundingRect.width,
    y: boundingRect.y + boundingRect.height / 2,
  }
}

function centerTopNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x + boundingRect.width / 2,
    y: boundingRect.y,
  }
}

function centerBottomNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x + boundingRect.width / 2,
    y: boundingRect.y + boundingRect.height,
  }
}

function centerMiddleNode(boundingRect: BoundingRect) {
  return {
    x: boundingRect.x + boundingRect.width / 2,
    y: boundingRect.y + boundingRect.height / 2,
  }
}

export const alignmentKeyNodeCalculatorMap: Record<AlignmentPosition, (boundingRect: BoundingRect) => { x: number, y: number }> = {
  [AlignmentPosition.LEFT_TOP]: leftTopNode,
  [AlignmentPosition.LEFT_BOTTOM]: leftBottomNode,
  [AlignmentPosition.LEFT_MIDDLE]: leftMiddleNode,
  [AlignmentPosition.RIGHT_TOP]: rightTopNode,
  [AlignmentPosition.RIGHT_BOTTOM]: rightBottomNode,
  [AlignmentPosition.RIGHT_MIDDLE]: rightMiddleNode,
  [AlignmentPosition.CENTER_TOP]: centerTopNode,
  [AlignmentPosition.CENTER_BOTTOM]: centerBottomNode,
  [AlignmentPosition.CENTER_MIDDLE]: centerMiddleNode,
}
