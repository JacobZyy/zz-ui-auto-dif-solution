import type { UIMessage } from '@ui-differ/mastergo-shared/lib'
import { getPreviewImg, uIMessageRecord } from '@ui-differ/mastergo-shared/lib'

mg.showUI(__html__, {
  width: 420,
  height: 750,
})

// 监听选择变化事件
mg.on('selectionchange', () => {
  getPreviewImg()
  // 获取当前选择的节点，通过 postMessage 发到 UI 侧
  const selection = mg.document.currentPage.selection

  if (selection && selection.length > 0) {
    // 支持多节点选择
    const nodes = Array.from(selection).map((node: any) => {
      // 获取直接子节点 ID 列表
      const childIds = node.children ? Array.from(node.children).map((child: any) => child.id) : []

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        parentId: node.parent?.id,
        childIds,
      }
    })

    if (nodes.length === 1) {
      // 单节点
      mg.ui.postMessage({ type: 'SELECTION_CHANGE', data: nodes[0] })
    }
    else {
      // 多节点
      mg.ui.postMessage({ type: 'SELECTION_CHANGE', data: { nodes } })
    }
  }
  else {
    mg.ui.postMessage({ type: 'SELECTION_CHANGE', data: null })
  }
})

mg.ui.onmessage = (msg: { type: UIMessage, data: any }) => {
  const { type, data } = msg
  const handler = uIMessageRecord[type]
  return handler?.(data as never)
}
