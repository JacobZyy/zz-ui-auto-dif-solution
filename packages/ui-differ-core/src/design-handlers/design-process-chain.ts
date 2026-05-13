import type { RootNodeOffsetInfo } from '../types'
import {
  getNeighborNodeDistance,
  processPaddingInfo,
  removeSameSizePositionChildren,
  searchNeighborNodes,
  shrinkRectBounding,
} from '../common-handlers'
import { getDesignInfoRecorder } from './design-info-recorder'
import { processDesignNodeShouldShrinkBounding } from './process-design-node-should-shrink-bounding'
import { reOrderDesignNodes } from './re-order-design-nodes'

/**
 * 创建配置化的设计节点处理链
 * @returns 处理链函数
 */
export async function processDesignNodeChain(rootNode: SceneNode, rootOffset: RootNodeOffsetInfo) {
  return getDesignInfoRecorder(rootNode, rootOffset)
    .then((map) => {
      return reOrderDesignNodes(map)
    })
    .then((map) => {
      return processDesignNodeShouldShrinkBounding(map)
    })
    .then((map) => {
      return processPaddingInfo(map)
    })
    .then((map) => {
      return shrinkRectBounding(map)
    })
    .then((map) => {
      return removeSameSizePositionChildren({ flatNodeMap: map, prevRemove: false })
    })
    .then((map) => {
      return searchNeighborNodes(map)
    })
    .then((map) => {
      return getNeighborNodeDistance(map)
    })
}
