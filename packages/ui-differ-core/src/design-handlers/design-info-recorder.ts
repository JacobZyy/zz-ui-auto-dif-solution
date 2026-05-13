import type { BoundingRect, NodeInfo, NodeWithChild, RootNodeOffsetInfo, UniqueId } from '../types'
import { clone } from 'radash'
import { judgeIsRadiusRectanglePath } from '../design-pre-process'
import { designConfigs } from '../stores'
import { nodeWithChildSet } from '../types'
import {
  convertHeight,
  convertWidth,
  convertX,
  convertY,
  floorOrderTraversalWithNode,
  getDesignNodeTextStyle,
} from '../utils'
import { getDesignBackgroundColor, getDesignBorderInfo, getDesignPaddingInfo } from './get-design-style-value'
import { getParentSiblingNodes } from './get-parent-sibling-nodes'

function processSingleDesignNodeInfo(
  designNode: SceneNode,
  rootOffset: { x: number, y: number, id: UniqueId },
  designNodeParentSiblingMap: Map<UniqueId, Pick<NodeInfo, 'parentId' | 'sibling'>>,
) {
  const nodeId = designNode.id
  // 在上方已经进行过滤了
  const boundingRect = designNode.absoluteBoundingBox!
  const isRoot = nodeId === rootOffset.id

  const originY = convertY(boundingRect.y, rootOffset.y, isRoot)
  const fixedY = originY < 0 ? 0 : originY
  const originHeight = convertHeight(boundingRect.height, isRoot)
  const fixedHeight = originY < 0 ? originY + originHeight : originHeight

  const realBoundingRect: BoundingRect = {
    x: convertX(boundingRect.x, rootOffset.x),
    y: fixedY,
    width: convertWidth(boundingRect.width),
    height: fixedHeight,
  }

  const hasChildren = nodeWithChildSet.has(designNode.type)
  // 获取子节点id
  const childrenIds = hasChildren ? Array.from((designNode as NodeWithChild).children).map(child => child.id) : []
  const paddingInfo = getDesignPaddingInfo(designNode)
  const borderInfo = getDesignBorderInfo(designNode)
  const backgroundColor = getDesignBackgroundColor(designNode)
  const siblingParentInfo = designNodeParentSiblingMap.get(nodeId)
  const parentId = siblingParentInfo?.parentId || ''
  const siblingIds = siblingParentInfo?.sibling || []
  const textStyleInfo = getDesignNodeTextStyle(designNode)

  const isRadiusRectanglePath = designNode.type === 'PEN' && judgeIsRadiusRectanglePath(designNode as PenNode)

  const newNode: NodeInfo = {
    nodeName: designNode.name,
    uniqueId: nodeId,
    boundingRect: realBoundingRect,
    parentId,
    children: childrenIds,
    sibling: siblingIds,
    paddingInfo,
    borderInfo,
    backgroundColor,
    neighborMarginInfo: {},
    initialNeighborInfos: {},
    textStyleInfo,
    originBounding: clone(realBoundingRect),
    shouldSkipShrinkBounding: false,
    tagName: isRadiusRectanglePath ? 'Rectangle' : designNode.type,
  }
  return newNode
}

export async function getDesignInfoRecorder(rootDesignNode: SceneNode, rootNodeBoundingOffset: RootNodeOffsetInfo) {
  const floorOrderNodeList = Array.from(floorOrderTraversalWithNode(rootDesignNode))
    .filter((designNode) => {
      const realBoundingRect = designNode.absoluteBoundingBox
      if (!realBoundingRect || !designNode.id)
        // 没有渲染的节点，或者没有id的节点，直接过滤掉
        return false

      // 位于上下安全区的节点先全都过滤掉
      const currentY = realBoundingRect.y - rootNodeBoundingOffset.y
      const safeTopHeight = designConfigs.getSafeTopHeight()
      const safeBottomHeight = designConfigs.getSafeBottomHeight()
      const isOverTopNode = currentY + realBoundingRect.height <= safeTopHeight
      const isOverBottomNode = currentY >= (rootDesignNode.height - safeBottomHeight)
      return (!isOverTopNode && !isOverBottomNode) || designNode.id === rootDesignNode.id
    })
  const designNodeParentSiblingMap = getParentSiblingNodes(rootDesignNode)

  const flatNodeMapEntries = floorOrderNodeList
    .filter((designNode) => {
      const realBoundingRect = designNode.absoluteBoundingBox
      if (!realBoundingRect || !designNode.id)
        // 没有渲染的节点，或者没有id的节点，直接过滤掉
        return false

      // 位于上下安全区的节点先全都过滤掉
      const currentY = realBoundingRect.y - rootNodeBoundingOffset.y
      const safeTopHeight = designConfigs.getSafeTopHeight()
      const safeBottomHeight = designConfigs.getSafeBottomHeight()
      const isOverTopNode = currentY + realBoundingRect.height <= safeTopHeight
      const isOverBottomNode = currentY >= (rootDesignNode.height - safeBottomHeight)
      return (!isOverTopNode && !isOverBottomNode) || designNode.id === rootDesignNode.id
    })
    .map((designNode) => {
      // 格式化节点信息
      const nodeInfo = processSingleDesignNodeInfo(designNode, rootNodeBoundingOffset, designNodeParentSiblingMap)
      return [nodeInfo.uniqueId, nodeInfo] as const
    })

  const initialNodeMap = new Map(flatNodeMapEntries)
  return initialNodeMap
}
