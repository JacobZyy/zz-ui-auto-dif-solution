import { UIMessage } from '../message/type'
import { backupDesignNodes } from './backup-design-nodes'
import { clearUnVisibleNodes } from './clear-un-visible-nodes'
import { drawNodeOverlays } from './drawNodeOverlays'
import { fixCombineMaskNodes } from './fix-combine-mask-nodes'
import { fixCombineSliceNodes } from './fix-combine-slice-nodes'
import { fixHoistingRectangleNodes } from './fix-hoisting-rectangle-nodes'
import { fixOverflowHiddenNodes } from './fix-overflow-hidden-nodes'
import { fixUnifiedLineHeightNodes } from './fix-unified-line-height-nodes'
import { getCombineMaskNodes } from './get-combine-mask-nodes'
import { getCombineSliceNodes } from './get-combine-slice-nodes'
import { getCurrentSelection } from './get-current-selection'
import { getHoistingRectangleNodes } from './get-hoisting-rectangle-nodes'
import { getNodeInfo } from './get-node-info'
import { getOverflowHiddenNodes } from './get-overflow-hidden-nodes'
import { getPreviewImg } from './get-preview-image'
import { getUnVisibleNodes } from './get-un-visible-nodes'
import { getUnifiedLineHeightNodes } from './get-unified-line-height-nodes'
import { getDocumentInfo } from './getDocumentInfo'
import { getTargetNodeTopFrame } from './getTopNodeFrame'
import { locateTargetNode } from './locate-target-node'
import { onSelectionChange } from './notify-selection-changed'
import { sendSelectionToUI } from './sendSelectionToUI'

export const uIMessageRecord: Record<UIMessage, (data: never) => void | Promise<void>> = {
  [UIMessage.GET_SELECTION]: sendSelectionToUI,
  [UIMessage.DRAW_NODE_OVERLAYS]: drawNodeOverlays,
  [UIMessage.GET_DOCUMENT_INFO]: getDocumentInfo,
  [UIMessage.GET_TOP_PARENT_NODE]: getTargetNodeTopFrame,
  [UIMessage.GET_PREVIEW_IMAGE]: getPreviewImg,
  [UIMessage.GET_UN_VISIBLE_NODES]: getUnVisibleNodes,
  [UIMessage.LOCATE_NODE]: locateTargetNode,
  [UIMessage.CLEAR_UN_VISIBLE_NODES]: clearUnVisibleNodes,
  // 预处理步骤
  [UIMessage.GET_COMBINE_MASK_NODES]: getCombineMaskNodes,
  [UIMessage.FIX_COMBINE_MASK_NODES]: fixCombineMaskNodes,
  [UIMessage.GET_COMBINE_SLICE_NODES]: getCombineSliceNodes,
  [UIMessage.FIX_COMBINE_SLICE_NODES]: fixCombineSliceNodes,
  [UIMessage.GET_HOISTING_RECTANGLE_NODES]: getHoistingRectangleNodes,
  [UIMessage.FIX_HOISTING_RECTANGLE_NODES]: fixHoistingRectangleNodes,
  [UIMessage.GET_UNIFIED_LINE_HEIGHT_NODES]: getUnifiedLineHeightNodes,
  [UIMessage.FIX_UNIFIED_LINE_HEIGHT_NODES]: fixUnifiedLineHeightNodes,
  [UIMessage.GET_OVERFLOW_HIDDEN_NODES]: getOverflowHiddenNodes,
  [UIMessage.FIX_OVERFLOW_HIDDEN_NODES]: fixOverflowHiddenNodes,
  [UIMessage.BACKUP_DESIGN_NODES]: backupDesignNodes,
  [UIMessage.GET_CURRENT_SELECTION]: getCurrentSelection,
  [UIMessage.GET_NODE_INFO]: getNodeInfo,
}

export {
  backupDesignNodes,
  drawNodeOverlays,
  fixCombineMaskNodes,
  fixCombineSliceNodes,
  fixHoistingRectangleNodes,
  fixOverflowHiddenNodes,
  fixUnifiedLineHeightNodes,
  // 预处理 handler
  getCombineMaskNodes,
  getCombineSliceNodes,
  getCurrentSelection,
  getDocumentInfo,
  getHoistingRectangleNodes,
  getNodeInfo,
  getOverflowHiddenNodes,
  getPreviewImg,
  getTargetNodeTopFrame,
  getUnifiedLineHeightNodes,
  getUnVisibleNodes,
  onSelectionChange,
  sendSelectionToUI,
}
