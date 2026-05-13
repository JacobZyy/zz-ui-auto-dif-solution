import { sendPluginMsgToUI } from '../message/sender'
import { PluginMessage } from '../message/type'

/**
 * 备份设计稿：复制 targetRootNode 的副本到页面另一位置
 * 备份名格式：{原名}-备份
 */
export async function backupDesignNodes(data?: { targetNodeId?: string }) {
  const targetNodeId = data?.targetNodeId
  if (!targetNodeId)
    return sendPluginMsgToUI({ type: PluginMessage.BACKUP_COMPLETED, data: { success: false } })

  const targetNode = mg.getNodeById(targetNodeId) as SceneNode | null
  if (!targetNode)
    return sendPluginMsgToUI({ type: PluginMessage.BACKUP_COMPLETED, data: { success: false } })

  const currentPage = mg.document.currentPage
  if (!currentPage)
    return sendPluginMsgToUI({ type: PluginMessage.BACKUP_COMPLETED, data: { success: false } })

  try {
    console.log('[Backup] Starting backup for node:', targetNode.name, 'id:', targetNode.id)

    // 计算备份位置：放在原节点右侧偏移
    const offsetX = (targetNode.width || 200) + 100
    const backupX = (targetNode.x || 0) + offsetX
    const backupY = targetNode.y || 0
    console.log('[Backup] Backup position:', backupX, backupY)

    // 递归复制节点树
    const copyNodeTree = (sourceNode: SceneNode, depth: number = 0): SceneNode | null => {
      const indent = '  '.repeat(depth)
      console.log(`${indent}[Backup] Copying node:`, sourceNode.name, 'type:', sourceNode.type)

      let newNode: SceneNode | null = null

      try {
        // 根据类型创建对应节点
        switch (sourceNode.type) {
          case 'FRAME':
          case 'GROUP':
            newNode = mg.createFrame()
            break
          case 'RECTANGLE':
            newNode = mg.createRectangle()
            break
          case 'ELLIPSE':
            newNode = mg.createEllipse()
            break
          case 'TEXT':
            newNode = mg.createText()
            break
          case 'LINE':
            newNode = mg.createLine()
            break
          default:
            console.log(`${indent}[Backup] Unknown type, defaulting to frame`)
            newNode = mg.createFrame()
        }

        if (!newNode) {
          console.log(`${indent}[Backup] Failed to create node`)
          return null
        }

        // 复制基础属性
        newNode.name = `${sourceNode.name || ''}-备份`
        // x, y 是相对于父节点的坐标，复制时保留
        if (sourceNode.x !== undefined)
          (newNode as LayoutMixin).x = sourceNode.x
        if (sourceNode.y !== undefined)
          (newNode as LayoutMixin).y = sourceNode.y
        if (sourceNode.width !== undefined)
          (newNode as LayoutMixin).width = sourceNode.width
        if (sourceNode.height !== undefined)
          (newNode as LayoutMixin).height = sourceNode.height

        console.log(`${indent}[Backup] Position set: x=`, (newNode as LayoutMixin).x, 'y=', (newNode as LayoutMixin).y)

        // 复制样式属性
        const srcGeo = sourceNode as GeometryMixin
        const dstGeo = newNode as GeometryMixin
        if (srcGeo.fills)
          dstGeo.fills = JSON.parse(JSON.stringify(srcGeo.fills))
        if (srcGeo.strokes)
          dstGeo.strokes = JSON.parse(JSON.stringify(srcGeo.strokes))
        if (srcGeo.strokeWeight !== undefined)
          dstGeo.strokeWeight = srcGeo.strokeWeight
        if ((sourceNode as CornerMixin).cornerRadius !== undefined)
          (newNode as CornerMixin).cornerRadius = (sourceNode as CornerMixin).cornerRadius
        const srcBlend = sourceNode as BlendMixin
        const dstBlend = newNode as BlendMixin
        if (srcBlend.opacity !== undefined)
          dstBlend.opacity = srcBlend.opacity
        // isVisible per MasterGo typings（非 .visible）
        ;(newNode as SceneNodeMixin).isVisible = (sourceNode as SceneNodeMixin).isVisible

        // 处理文本内容（.characters，非 .text）
        if (sourceNode.type === 'TEXT') {
          (newNode as TextNode).characters = (sourceNode as TextNode).characters
        }

        // 处理蒙版相关属性
        if (srcBlend.isMask !== undefined)
          dstBlend.isMask = srcBlend.isMask
        if ((sourceNode as FrameNode).clipsContent !== undefined) {
          (newNode as FrameNode).clipsContent = (sourceNode as FrameNode).clipsContent
        }
        if (srcBlend.isMaskOutline !== undefined)
          dstBlend.isMaskOutline = srcBlend.isMaskOutline
        if ('isMaskVisible' in sourceNode) {
          (dstBlend as BlendMixin & { isMaskVisible?: boolean }).isMaskVisible
            = (srcBlend as BlendMixin & { isMaskVisible?: boolean }).isMaskVisible
        }

        // 处理容器类型节点：递归复制子节点
        if ('children' in sourceNode && sourceNode.children && sourceNode.children.length > 0) {
          const children = Array.from(sourceNode.children)
          console.log(`${indent}[Backup] Has ${children.length} children`)
          for (const child of children) {
            const copiedChild = copyNodeTree(child, depth + 1)
            if (copiedChild) {
              try {
                ;(newNode as ChildrenMixin<SceneNode>).appendChild(copiedChild)
                console.log(`${indent}[Backup] Appended child:`, child.name)
              }
              catch (e) {
                console.error(`${indent}[Backup] Failed to append child:`, child.name, e)
              }
            }
            else {
              console.error(`${indent}[Backup] Child copy failed:`, child.name)
            }
          }
        }

        return newNode
      }
      catch (e) {
        console.error(`${indent}[Backup] Error copying node:`, sourceNode.name, e)
        return null
      }
    }

    // 执行复制
    console.log('[Backup] Starting copy tree...')
    const backupNode = copyNodeTree(targetNode)
    if (!backupNode) {
      console.error('[Backup] Copy failed')
      return sendPluginMsgToUI({ type: PluginMessage.BACKUP_COMPLETED, data: { success: false } })
    }

    console.log('[Backup] Copy complete, setting position...')

    // 设置备份容器属性
    const nodeName = targetNode.name || '设计稿'
    backupNode.name = `${nodeName}-备份`
    ;(backupNode as LayoutMixin).x = backupX
    ;(backupNode as LayoutMixin).y = backupY

    console.log('[Backup] Position set on root:', backupX, backupY)

    // 将备份节点添加到页面
    console.log('[Backup] Appending to page...')
    currentPage.appendChild(backupNode)
    console.log('[Backup] Appended successfully')

    sendPluginMsgToUI({ type: PluginMessage.BACKUP_COMPLETED, data: { success: true } })
  }
  catch (error) {
    console.error('Backup failed:', error)
    sendPluginMsgToUI({ type: PluginMessage.BACKUP_COMPLETED, data: { success: false } })
  }
}
