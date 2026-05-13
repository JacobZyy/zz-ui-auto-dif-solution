import type { NodeInfo, RootNodeOffsetInfo, UniqueId } from '@ui-differ/core'
import { sendUIMsgToPlugin, UIMessage } from '@ui-differ/mastergo-shared/lib'

function createColors() {
  return [
    { r: 1, g: 0, b: 0, a: 1 },
    { r: 0, g: 1, b: 0, a: 1 },
    { r: 0, g: 0, b: 1, a: 1 },
    { r: 1, g: 1, b: 0, a: 1 },
    { r: 1, g: 0, b: 1, a: 1 },
    { r: 0, g: 1, b: 1, a: 1 },
    { r: 1, g: 0.65, b: 0, a: 1 },
    { r: 0.5, g: 0, b: 0.5, a: 1 },
    { r: 0, g: 0.5, b: 0, a: 1 },
    { r: 1, g: 0.75, b: 0.8, a: 1 },
  ]
}

const OVERLAY_FILL_ALPHA = 0.12

function createOverlayFill(color: { r: number, g: number, b: number }) {
  return {
    type: 'SOLID' as const,
    color: {
      ...color,
      a: OVERLAY_FILL_ALPHA,
    },
    opacity: OVERLAY_FILL_ALPHA,
  }
}

function calculateAbsolutePosition(
  boundingRect: NodeInfo['boundingRect'],
  rootOffset: RootNodeOffsetInfo,
) {
  return {
    x: rootOffset.x + boundingRect.x,
    y: rootOffset.y + boundingRect.y,
    width: Math.max(boundingRect.width, 1),
    height: Math.max(boundingRect.height, 1),
  }
}

function createDrawingData(flatNodeMap: Map<UniqueId, NodeInfo>, rootOffset: RootNodeOffsetInfo) {
  const colors = createColors()

  return {
    overlays: Array.from(flatNodeMap.entries()).map(([uniqueId, nodeInfo], index) => {
      const color = colors[index % colors.length]

      return ({
        uniqueId,
        name: `ui-differ-overlay-${nodeInfo.nodeName || index}-${uniqueId}`,
        position: calculateAbsolutePosition(nodeInfo.boundingRect, rootOffset),
        style: {
          fills: [createOverlayFill(color)],
          strokes: [{
            type: 'SOLID' as const,
            color,
          }],
          strokeWeight: 1,
          strokeAlign: 'INSIDE' as const,
        },
      })
    }),
    rootOffset,
  }
}

export function drawCurrentNodeInfos(flatNodeMap: Map<UniqueId, NodeInfo>, rootOffset: RootNodeOffsetInfo) {
  const drawingData = createDrawingData(flatNodeMap, rootOffset)
  sendUIMsgToPlugin({
    type: UIMessage.DRAW_NODE_OVERLAYS,
    data: drawingData,
  })
}
